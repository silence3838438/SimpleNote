// 云函数：语音识别（支持百度和腾讯云）
const cloud = require('wx-server-sdk')
const request = require('request-promise')

cloud.init({
  env: 'cloud1-8gxevfq393690dfe'
})

exports.main = async (event, context) => {
  const { fileID } = event
  
  try {
    // 1. 获取音频文件临时链接
    const res = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    
    const audioUrl = res.fileList[0].tempFileURL
    console.log('音频文件URL:', audioUrl)
    
    // 2. 尝试使用微信云开发内置的语音识别
    try {
      console.log('尝试使用微信云开发语音识别')
      const text = await recognizeByWechatCloud(audioUrl)
      if (text) {
        // ✅ 识别成功后立即删除录音文件
        await deleteAudioFile(fileID)
        return {
          success: true,
          text: text
        }
      }
    } catch (error) {
      console.log('微信云识别失败:', error.message)
    }
    
    // 3. 降级使用百度语音识别
    console.log('降级使用百度语音识别')
    const audioBuffer = await downloadAudio(audioUrl)
    const text = await callBaiduASR(audioBuffer)
    
    // ✅ 识别成功后立即删除录音文件
    await deleteAudioFile(fileID)
    
    return {
      success: true,
      text: text
    }
  } catch (error) {
    console.error('语音识别失败:', error)
    
    // ✅ 识别失败也删除录音文件（避免累积无用文件）
    await deleteAudioFile(fileID)
    
    return {
      success: false,
      error: error.message
    }
  }
}

// 使用微信云开发内置的语音识别
async function recognizeByWechatCloud(audioUrl) {
  try {
    // 微信云开发提供了 AI 能力，包括语音识别
    // 需要在云开发控制台开通 AI 能力
    const result = await cloud.openapi.ai.voiceToText({
      format: 'mp3',
      voiceUrl: audioUrl,
      lang: 'zh_CN'
    })
    
    console.log('微信云识别结果:', result)
    
    if (result && result.result) {
      return result.result
    }
    
    return null
  } catch (error) {
    console.error('微信云识别异常:', error)
    throw error
  }
}

// 调用百度语音识别API
async function callBaiduASR(audioBuffer) {
  const API_KEY = 'fJ57RtJLbFg8OEf2N5CFTXCl'
  const SECRET_KEY = 'PMvOQF5k2XCQcrI8lptKx9DGtknqpjKk'
  
  console.log('音频文件大小:', audioBuffer.length, 'bytes')
  
  // 尝试多种格式
  const formats = [
    { format: 'm4a', rate: 16000 },
    { format: 'aac', rate: 16000 },
    { format: 'mp3', rate: 16000 },
    { format: 'amr', rate: 8000 }
  ]
  
  let lastError = null
  
  for (const config of formats) {
    try {
      console.log(`尝试格式: ${config.format}, 采样率: ${config.rate}`)
      
      // 1. 获取access_token
      const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`
      const tokenRes = await request({
        url: tokenUrl,
        method: 'POST',
        json: true,
        timeout: 10000
      })
      
      if (tokenRes.error) {
        throw new Error('获取access_token失败')
      }
      
      const accessToken = tokenRes.access_token
      
      // 2. 调用语音识别
      const asrUrl = `https://vop.baidu.com/server_api`
      const audioBase64 = audioBuffer.toString('base64')
      
      const asrRes = await request({
        url: asrUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        json: true,
        timeout: 30000,
        body: {
          format: config.format,
          rate: config.rate,
          channel: 1,
          cuid: 'qiannaqu',
          token: accessToken,
          speech: audioBase64,
          len: audioBuffer.length
        }
      })
      
      console.log(`百度ASR返回 (${config.format}):`, JSON.stringify(asrRes))
      
      if (asrRes.err_no === 0 && asrRes.result && asrRes.result.length > 0) {
        return asrRes.result[0]
      }
      
      lastError = new Error(`格式${config.format}识别失败(${asrRes.err_no})`)
    } catch (error) {
      console.log(`格式${config.format}失败:`, error.message)
      lastError = error
    }
  }
  
  throw lastError || new Error('所有格式都识别失败，请说清楚一些或使用文字输入')
}

// 下载音频文件
async function downloadAudio(url) {
  const audioData = await request({
    url: url,
    method: 'GET',
    encoding: null
  })
  
  return audioData
}

// 删除音频文件
async function deleteAudioFile(fileID) {
  try {
    await cloud.deleteFile({
      fileList: [fileID]
    })
    console.log('✅ 录音文件已自动删除:', fileID)
  } catch (error) {
    // 删除失败不影响识别结果，只记录日志
    console.log('⚠️ 删除录音文件失败（不影响识别）:', error.message)
  }
}
