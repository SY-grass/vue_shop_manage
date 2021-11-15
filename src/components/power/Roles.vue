<template>
  <div>
      <!-- 面包屑导航区域 -->
      <el-breadcrumb separator-class="el-icon-arrow-right">
        <el-breadcrumb-item :to="{ path: '/user' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>权限管理</el-breadcrumb-item>
        <el-breadcrumb-item>角色列表</el-breadcrumb-item>
      </el-breadcrumb>
      <!-- 卡片视图 -->
      <el-card>
          <!-- 添加角色区域 -->
          <el-row>
              <el-col>
                  <el-button type="primary">添加角色</el-button>
              </el-col>
          </el-row>

          <!-- 角色列表区域 -->
          <el-table :data="roleList" border stripe >
              <!-- 展开列 -->
              <el-table-column type="expand">
                  <template slot-scope="scope">
                    <el-row :class="['bdbottom',i1===0?'bdtop':'','vcenter']"
                        v-for="(item1,i1) in scope.row.children" :key="item1.id"
                        closable @close="removeRightById(scope.row,item1.id)">
                        <!-- 渲染一级权限 -->
                        <el-col :span="5">
                            <el-tag>
                                {{item1.authName}}
                            </el-tag>
                            <i class="el-icon-caret-right"></i>
                        </el-col>
                        <!-- 渲染二级 -->
                        <el-col :span="19">
                             <!-- 通过 for 循环，嵌套渲染二级权限 -->
                            <el-row :class="[i2===0?'':'bdtop','vcenter']"
                                v-for="(item2,i2) in item1.children" :key="item2.id"
                                closable @close="removeRightById(scope.row,item2.id)">
                                <el-col :span="6">
                                    <el-tag type="success">
                                        {{item2.authName}}
                                    </el-tag>
                                    <i class="el-icon-caret-right"></i>

                                </el-col>
                                <el-col :span="18">
                                    <el-tag :class="[i3===0?'':'bdtop']"
                                        v-for="(item3,i3) in item2.children"
                                        :key="item3.id" type="warning" closable
                                        @close="removeRightById(scope.row,item3.id)">
                                        {{item3.authName}}
                                    </el-tag>
                                </el-col>
                            </el-row>
                        </el-col>
                    </el-row>
                  </template>
              </el-table-column>
              <!-- 索引列 -->
              <el-table-column type="index"></el-table-column>
              <el-table-column label="角色名称" prop="roleName"></el-table-column>
              <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
              <el-table-column label="操作" width="300px">
                  <template slot-scope="scope">
                    <el-button size="mini" type="primary" icon="el-icon-edit">编辑</el-button>
                    <el-button size="mini" type="danger" icon="el-icon-delete">删除</el-button>
                    <el-button size="mini" type="warning" icon="el-icon-setting"
                        @click="showSetRightDialog(scope.row)">分配权限</el-button>
                  </template>
              </el-table-column>
          </el-table>
      </el-card>

      <!-- 分配权限的对话框 -->
      <el-dialog
        title="分配权限"
        :visible.sync="SetRightDialogVisible"
        width="50%" @close="setRightDialogClosed">
        <!-- 树形控件 -->
        <el-tree :data="rightsList" :props="treeProps" show-checkbox
            node-key="id" default-expand-all
            :default-checked-keys="defKeys" ref="treeRef"></el-tree>
        <span slot="footer" class="dialog-footer">
            <el-button @click="SetRightDialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="allotRights">确 定</el-button>
        </span>
        </el-dialog>

  </div>
</template>

<script>
export default {
  data () {
    return {
      roleList: [],
      SetRightDialogVisible: false,
      rightsList: [],
      //   树形控件的属性绑定对象
      treeProps: {
        children: 'children',
        label: 'authName'
      },
      //   默认选中的节点id值数组
      defKeys: [],
      roleId: ''
    }
  },
  created () {
    this.getRolesList()
  },
  methods: {
    async getRolesList () {
      const { data: res } = await this.$http.get('roles')
      if (res.meta.status !== 200) {
        return this.$message.error('获取角色列表失败')
      }
      this.roleList = res.data
      console.log(this.roleList)
    },
    async removeRightById (role, rightId) {
      const confirmResult = await this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch(err => err)
      if (confirmResult !== 'confirm') {
        return this.$message.info('取消了删除')
      }
      const { data: res } = await this.$http.delete(`roles/${role.id}/rights/${rightId}`)
      if (res.meta.status !== 200) {
        return this.$message.error('删除权限失败')
      }
      role.children = res.data
    },
    // 展示分配权限对话框
    async showSetRightDialog (role) {
      this.roleId = role.id
      // 获取所有权限的数据
      const { data: res } = await this.$http.get('rights/tree')
      if (res.meta.status !== 200) {
        return this.$message.error('获取权限数据失败')
      }
      this.rightsList = res.data
      console.log(this.roleList)
      this.getLeafKeys(role, this.defKeys)

      this.SetRightDialogVisible = true
    },
    // 通过递归的形式，获取角色下所有三级权限的id，
    // 并保存到defKeys数组中
    getLeafKeys (node, arr) {
      // 如果不包含 children 属性，则不包含三级节点
      if (!node.children) {
        return arr.push(node.id)
      }

      node.children.forEach(item => {
        this.getLeafKeys(item, arr)
      })
    },
    setRightDialogClosed () {
      this.defKeys = []
    },
    async allotRights () {
      const keys = [
        ...this.$refs.treeRef.getCheckedKeys(),
        ...this.$refs.treeRef.getHalfCheckedKeys()
      ]
      const idStr = keys.join(',')
      const { data: res } = await this.$http.post(`roles/${this.roleId}/rights`, { rids: idStr })
      if (res.meta.status !== 200) {
        this.$message.error('分配权限失败！')
      }
      this.$message.success('分配权限成功')
      this.getRolesList()
      this.SetRightDialogVisible = false
    }
  }
}
</script>

<style lang="less" scoped>
.el-tag {
    margin: 7px;
}

.bdtop {
    border-top: 1px solid #eee;
}
.bdbottom {
    border-bottom: 1px solid #eee;
}
.vcenter {
    display: flex;
    align-items: center;
}
</style>
