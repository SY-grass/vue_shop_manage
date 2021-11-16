<template>
  <div>
      <!-- 面包屑导航区域 -->
      <el-breadcrumb separator-class="el-icon-arrow-right">
        <el-breadcrumb-item :to="{ path: '/user' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>商品管理</el-breadcrumb-item>
        <el-breadcrumb-item>商品分类</el-breadcrumb-item>
      </el-breadcrumb>
      <!-- 卡片视图 -->
      <el-card>
          <el-row>
              <el-col>
                  <el-button type="primary" @click="showAddCate">添加分类</el-button>
              </el-col>
          </el-row>

          <!-- 表格 -->
          <tree-table class="treeTable" :data="catelist" :columns="columns" :selection-type="false"
            :expand-type="false" show-index index-text="#" border :show-row-hover="false">
          <!-- 是否有效 -->
          <template slot="isok" slot-scope="scope">
            <i class="el-icon-success" v-if="scope.row.cat_deleted===false"
              style="color:lightgreen"></i>
            <i class="el-icon-error" v-else style="color:red"></i>
          </template>
          <!-- 排序 -->
          <template slot="order" slot-scope="scope">
            <el-tag size="mini" v-if="scope.row.cat_level===0">一级</el-tag>
            <el-tag type="success" size="mini" v-else-if="scope.row.cat_level===1">二级</el-tag>
            <el-tag type="warning" size="mini" v-else>三级</el-tag>
          </template>
          <!-- 操作 -->
          <template slot="opt" slot-scope="">
            <el-button size="mini" type="primary" icon="el-icon-edit">编辑</el-button>
            <el-button size="mini" type="danger" icon="el-icon-delete">删除</el-button>
          </template>
          </tree-table>
          <!-- 分页 -->
          <el-pagination @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="queryInfo.pagenum"
            :page-sizes="[3, 5, 10, 15]"
            :page-size="queryInfo.pagesize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total">
          </el-pagination>
      </el-card>

      <!-- 添加分类的对话框 -->
      <el-dialog title="添加分类"
        :visible.sync="AddCateDialogVisible"
        width="50%" @close="addCateDialogClosed"
      >
        <!-- 添加分类的表单 -->
        <el-form :model="AddCateForm" :rules="AddCateFormRules" ref="addCateFormRef"
          label-width="100px">
          <el-form-item label="分类名称：" prop="cat_name">
            <el-input v-model="AddCateForm.cat_name"></el-input>
          </el-form-item>
          <el-form-item label="父级分类：">
              <!-- options 数据源 -->
              <!-- props 用来指定配置对象 -->
            <el-cascader
              v-model="selectedKeys"
              :options="parentCateList"
              :props="cascaderProps"
              @change="parentCateChanged" clearable ref="elcascaderRefs">
            </el-cascader>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="AddCateDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addCate">确 定</el-button>
        </span>
      </el-dialog>

  </div>
</template>

<script>
export default {
  data () {
    return {
      // 查询条件
      queryInfo: {
        type: 3,
        pagenum: 1,
        pagesize: 10
      },
      // 商品分类的数据列表，默认为空
      catelist: [],
      total: 0,
      // 为table指定列的定义
      columns: [{
        label: '分类名称',
        prop: 'cat_name'
      },
      {
        label: '是否有效',
        // 将当前列定义为模板列
        type: 'template',
        // 当前列的模板名称
        template: 'isok'
      },
      {
        label: '排序',
        // 将当前列定义为模板列
        type: 'template',
        // 当前列的模板名称
        template: 'order'
      },
      {
        label: '操作',
        // 将当前列定义为模板列
        type: 'template',
        // 当前列的模板名称
        template: 'opt'
      }
      ],
      AddCateDialogVisible: false,
      // 添加分类的表单数据对象
      AddCateForm: {
        // 将要添加的分类的名称
        cat_name: '',
        // 父级分类 ID
        cat_pid: 0,
        // 分类的等级，默认：1级
        cat_level: 0
      },
      // 添加分类表单的验证规则对象
      AddCateFormRules: {
        cat_name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' }
        ]
      },
      // 父级分类列表
      parentCateList: [],
      cascaderProps: {
        expandTrigger: 'hover',
        value: 'cat_id',
        label: 'cat_name',
        children: 'children',
        checkStrictly: true
      },
      // 选中的父级分类的Id数组
      selectedKeys: []

    }
  },
  created () {
    this.getCateList()
  },
  methods: {
    // 获取商品分类数据
    async getCateList () {
      const { data: res } = await this.$http.get('categories', { params: this.queryInfo })
      if (res.meta.status !== 200) {
        return this.$message.error('获取商品分类失败')
      }
      this.catelist = res.data.result
      this.total = res.data.total
    },
    // 监听 pageSize 改变
    handleSizeChange (newSize) {
      this.queryInfo.pagesize = newSize
      this.getCateList()
    },
    handleCurrentChange (newPage) {
      this.queryInfo.pagenum = newPage
      this.getCateList()
    },
    showAddCate () {
      // 先获取父级分类的数据列表
      this.getParentCateList()
      this.AddCateDialogVisible = true
    },
    // 获取父级分类的数据列表
    async getParentCateList () {
      const { data: res } = await this.$http.get('categories', {
        params: {
          type: 2
        }
      })
      if (res.meta.status !== 200) {
        return this.$message.error('获取父级分类数据失败')
      }
      console.log(res.data)
      this.parentCateList = res.data
    },
    parentCateChanged () {
      console.log(this.selectedKeys)
      if (this.selectedKeys.length > 0) {
        // 父级分类的 ID
        this.AddCateForm.cat_pid = this.selectedKeys[this.selectedKeys.length - 1]
        this.$refs.elcascaderRefs.dropDownVisible = false
        this.AddCateForm.cat_level = this.selectedKeys.length
        return false
      } else {
        this.AddCateForm.cat_pid = 0
        this.AddCateForm.cat_level = 0
      }
    },
    addCate () {
      console.log(this.AddCateForm)
      this.$refs.addCateFormRef.validate(async valid => {
        if (!valid) return
        const { data: res } = await this.$http.post('categories', this.AddCateForm)
        if (res.meta.status !== 201) {
          return this.$message.error('添加分类失败！')
        }
        this.$message.success('添加分类成功')
        this.getCateList()
        this.AddCateDialogVisible = false
      })
    },
    addCateDialogClosed () {
      this.$refs.addCateFormRef.resetFields()
      this.selectedKeys = []
      this.AddCateForm.cat_pid = 0
      this.AddCateForm.cat_level = 0
    }
  }
}
</script>

<style lang="less" scoped>
.treeTable {
  margin-top: 15px;
}
.el-cascader {
  width: 100%;
}

</style>
