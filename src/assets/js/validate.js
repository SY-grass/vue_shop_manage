// 邮箱校验
export function validateEmail (str) {
  const reg = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
  return reg.test(str)
}

// 手机号校验

export function validateMobile (str) {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(str)
}
