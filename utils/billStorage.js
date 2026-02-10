// 账单数据存储管理工具
// 支持本地存储和云端存储的双向同步

import request from './request.js'

class BillStorage {
  constructor() {
    this.localKey = 'bills'
    this.syncKey = 'bills_synced'
    this.lastSyncTime = 'last_sync_time'
    this.syncInterval = 5 * 60 * 1000 // 5分钟同步一次
  }
  
  /**
   * 保存账单（本地 + 云端）
   */
  async saveBill(billData) {
    try {
      // 1. 先保存到本地
      const localBills = this.getLocalBills()
      
      const newBill = {
        id: Date.now(),
        ...billData,
        createTime: Date.now(), // 使用时间戳
        synced: false // 标记未同步
      }
      localBills.push(newBill)
      uni.setStorageSync(this.localKey, localBills)
      
      // 2. 尝试保存到云端
      try {
        const res = await this.callCloudFunction('add', newBill)
        if (res.success) {
          // 云端保存成功，更新本地数据的_id和同步状态
          newBill._id = res._id
          newBill.synced = true
          uni.setStorageSync(this.localKey, localBills)
        }
      } catch (cloudError) {
        console.log('云端保存失败，仅保存到本地:', cloudError)
        // 云端保存失败不影响本地使用
      }
      
      return { success: true, data: newBill }
    } catch (error) {
      console.error('保存账单失败:', error)
      return { success: false, message: error.message }
    }
  }
  
  /**
   * 获取账单列表（优先本地，定时同步云端）
   * @param {Object} params - 查询参数
   * @param {Boolean} allowSync - 是否允许后台同步，默认 false
   */
  async getBills(params = {}, allowSync = false) {
    // 1. 先返回本地数据（快速响应）
    const localBills = this.getLocalBills()
    
    // 如果不允许同步，直接返回本地数据
    if (!allowSync) {
      return localBills
    }
    
    // 2. 检查是否需要从云端同步
    const lastSync = uni.getStorageSync(this.lastSyncTime) || 0
    const now = Date.now()
    const shouldSync = (now - lastSync) > this.syncInterval
    
    // 如果不需要同步，直接返回本地数据
    if (!shouldSync) {
      return localBills
    }
    
    // 3. 后台异步同步云端数据（不阻塞返回）
    this.syncFromCloud().catch(err => {
      console.log('后台同步失败:', err)
    })
    
    return localBills
  }
  
  /**
   * 直接从API获取账单列表（不使用缓存）
   * @param {Object} params - 查询参数
   */
  async getFromAPI(params = {}) {
    try {
      const result = await this.callCloudFunction('list', params)
      
      if (result.success && result.data) {
        // 更新本地缓存
        uni.setStorageSync(this.localKey, result.data)
        uni.setStorageSync(this.lastSyncTime, Date.now())
        return result.data
      } else {
        return []
      }
    } catch (error) {
      console.error('从API获取账单失败:', error)
      throw error
    }
  }
  
  /**
   * 从云端同步数据到本地（后台执行）
   */
  async syncFromCloud() {
    try {
      const cloudResult = await this.callCloudFunction('list', {})
      if (cloudResult.success && cloudResult.data) {
        // 云端获取成功，更新本地缓存
        uni.setStorageSync(this.localKey, cloudResult.data)
        uni.setStorageSync(this.syncKey, true)
        uni.setStorageSync(this.lastSyncTime, Date.now())
        return { success: true, data: cloudResult.data }
      }
    } catch (cloudError) {
      console.log('云端同步失败:', cloudError)
      throw cloudError
    }
  }
  
  /**
   * 强制从云端获取最新数据（忽略时间间隔限制）
   */
  async forceGetFromCloud() {
    try {
      const cloudResult = await this.callCloudFunction('list', {})
      
      if (cloudResult.success && cloudResult.data) {
        // 云端获取成功，更新本地缓存
        uni.setStorageSync(this.localKey, cloudResult.data)
        uni.setStorageSync(this.syncKey, true)
        uni.setStorageSync(this.lastSyncTime, Date.now())
        return cloudResult.data
      } else {
        // 云端返回成功但没有数据，返回本地数据
        return this.getLocalBills()
      }
    } catch (cloudError) {
      console.error('云端获取失败:', cloudError)
      // 如果云端获取失败，返回本地数据
      return this.getLocalBills()
    }
  }
  
  /**
   * 同步本地数据到云端（仅同步未同步的数据）
   */
  async syncToCloud() {
    try {
      const localBills = this.getLocalBills()
      const unsyncedBills = localBills.filter(bill => !bill.synced && !bill._id)
      
      if (unsyncedBills.length === 0) {
        // 没有未同步的数据，尝试从云端拉取最新数据
        const lastSync = uni.getStorageSync(this.lastSyncTime) || 0
        const now = Date.now()
        
        // 如果距离上次同步超过5分钟，才从云端拉取
        if ((now - lastSync) > this.syncInterval) {
          await this.syncFromCloud()
        }
        
        return { success: true, message: '数据已同步' }
      }
      
      const result = await this.callCloudFunction('sync', { bills: unsyncedBills })
      
      if (result.success) {
        // 标记所有数据为已同步
        localBills.forEach(bill => {
          bill.synced = true
        })
        uni.setStorageSync(this.localKey, localBills)
        uni.setStorageSync(this.syncKey, true)
        uni.setStorageSync(this.lastSyncTime, Date.now())
      }
      
      return result
    } catch (error) {
      console.error('同步失败:', error)
      return { success: false, message: error.message }
    }
  }
  
  /**
   * 获取本地账单
   */
  getLocalBills() {
    return uni.getStorageSync(this.localKey) || []
  }
  
  /**
   * 检查是否已同步
   */
  isSynced() {
    return uni.getStorageSync(this.syncKey) || false
  }
  
  /**
   * 调用云函数或API
   */
  async callCloudFunction(action, data) {
    // 统一使用HTTP API
    return request.call('billManager', { action, data })
  }
  
  /**
   * 获取预算（优先本地，减少云端请求）
   */
  async getBudget() {
    // 1. 先返回本地数据
    const localBudget = uni.getStorageSync('budget')
    if (localBudget) {
      return localBudget
    }
    
    // 2. 本地没有数据时才从云端获取
    try {
      const result = await this.callCloudFunction('getBudget', {})
      if (result.success) {
        // 更新本地缓存
        uni.setStorageSync('budget', result.budget)
        return result.budget
      }
    } catch (error) {
      console.log('获取云端预算失败，使用默认值:', error)
    }
    
    // 3. 返回默认值
    const defaultBudget = 6000
    uni.setStorageSync('budget', defaultBudget)
    return defaultBudget
  }
  
  /**
   * 设置预算
   */
  async setBudget(amount) {
    try {
      // 先保存到本地
      uni.setStorageSync('budget', amount)
      
      // 尝试保存到云端
      const result = await this.callCloudFunction('setBudget', { amount })
      return result
    } catch (error) {
      console.error('设置预算失败:', error)
      return { success: false, message: error.message }
    }
  }
  
  /**
   * 删除账单
   */
  async deleteBill(billId, _id) {
    try {
      // 1. 删除本地数据
      let localBills = this.getLocalBills()
      localBills = localBills.filter(bill => bill.id !== billId)
      uni.setStorageSync(this.localKey, localBills)
      
      // 2. 如果有云端ID，删除云端数据
      if (_id) {
        try {
          await this.callCloudFunction('delete', { _id })
        } catch (cloudError) {
          console.log('云端删除失败:', cloudError)
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('删除账单失败:', error)
      return { success: false, message: error.message }
    }
  }
}

// 导出单例
export default new BillStorage()
