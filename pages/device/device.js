const app = getApp()
Page({
  data: {
    inputText: 'Hello World!',
    alreadySendText: '',
    receiveText: '',
    name: '',
    connectedDeviceId: '',
    serviceId: 0,
    characteristics: {},
    connected: true,
    uuidArray: [],
    index_uuid: 0,
  },
  bindPickerChange: function(e) {
    var that = this
    console.log('picker发送选择改变，携带值为', e.detail.value, ' uuid:' + that.data.uuidArray[e.detail.value])
    that.setData({
      index_uuid: e.detail.value,
      serviceId: that.data.uuidArray[e.detail.value]
    })
    // 获取蓝牙低功耗设备某个服务中所有特征
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.connectedDeviceId,
      serviceId: that.data.serviceId,
      success: function(res) {
        that.setData({
          characteristics: res.characteristics
        })
        // 启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值
        wx.notifyBLECharacteristicValueChange({
          state: true,
          deviceId: that.data.connectedDeviceId,
          serviceId: that.data.serviceId,
          characteristicId: that.data.characteristics[0].uuid,
          success: function(res) {
            console.log('启用notify成功')
          },
          fail(res) {
            console.log(res)
            wx.showModal({
              title: '提示',
              content: res.errMsg,
              showCancel: false,
              success: function(res) {
                that.setData({
                  searching: false
                })
              }
            })
          }
        })
      }
    })
  },
  bindInput: function(e) {
    this.setData({
      inputText: e.detail.value
    })
    console.log(e.detail.value)
  },
  SendTap: function() {
    var that = this
    if (that.data.connected) {
      var buffer = new ArrayBuffer(that.data.inputText.length)
      var dataView = new Uint8Array(buffer)
      for (var i = 0; i < that.data.inputText.length; i++) {
        dataView[i] = that.data.inputText.charCodeAt(i)
      }
      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: that.data.serviceId,
        characteristicId: that.data.characteristics[0].uuid,
        value: buffer,
        success: function(res) {
          console.log('发送成功');
          // 设置已经发送的数据内容
          that.setData({
            alreadySendText : that.data.alreadySendText + that.data.inputText
          });
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function(res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  onLoad: function(options) {
    var that = this
    console.log(options)
    that.setData({
      name: options.name,
      connectedDeviceId: options.connectedDeviceId
    })
    // 获取蓝牙低功耗设备所有服务 
    wx.getBLEDeviceServices({
      deviceId: that.data.connectedDeviceId,
      success: function(res) {
        var all_UUID = res.services;
        var UUID_lenght = all_UUID.length;

        console.log(all_UUID);

        /* 遍历服务数组 */
        for (var index = 0; index < UUID_lenght; index++) {
          var ergodic_UUID = all_UUID[index].uuid; //取出服务里面的UUID
          /* 判断是否是我们需要的00010203-0405-0607-0809-0A0B0C0D1910*/
          //if (ergodic_UUID == '00010203-0405-0607-0809-0A0B0C0D1910') {
          // if (ergodic_UUID == '00010203-0405-0607-0809-0A0B0C0D7FDE') {
          //   that.setData({
          //     index_uuid: index
          //   })
          // };
          that.setData({
            uuidArray: that.data.uuidArray.concat(ergodic_UUID)
          });
        };
        that.setData({
          serviceId: res.services[that.data.index_uuid].uuid
        })
        // 获取蓝牙低功耗设备某个服务中所有特征
        wx.getBLEDeviceCharacteristics({
          deviceId: options.connectedDeviceId,
          serviceId: res.services[that.data.index_uuid].uuid,
          success: function(res) {
            that.setData({
              characteristics: res.characteristics
            })
            wx.notifyBLECharacteristicValueChange({
              state: true,
              deviceId: options.connectedDeviceId,
              serviceId: that.data.serviceId,
              characteristicId: that.data.characteristics[0].uuid,
              success: function(res) {
                console.log('启用notify成功')
              },
              fail(res) {
                console.log(res)
                wx.showModal({
                  title: '提示',
                  content: res.errMsg,
                  showCancel: false,
                  success: function(res) {
                    that.setData({
                      searching: false
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
    wx.onBLEConnectionStateChange(function(res) {
      console.log(res.connected)
      that.setData({
        connected: res.connected
      })
    })
    wx.onBLECharacteristicValueChange(function(res) {
      console.log('接收到数据：' + app.buf2string(res.value));
      console.log('数据长度=' + app.buf2string(res.value).length);
      var time = that.getNowTime()
      that.setData({
        receiveText: that.data.receiveText + time + "(数据长度=" + app.buf2string(res.value).length + 
          ")：" + (app.buf2string(res.value)) + "\n"
      })
    })
  },
  onUnload: function() {
    wx.closeBLEConnection({
      deviceId: this.data.connectedDeviceId,
      success: function(res) {},
    })
  },
  DisConnectTap: function(e) {
    wx.closeBLEConnection({
      deviceId: this.data.connectedDeviceId,
      success (res) {
        console.log('断开连接成功！ ' + res)
        wx.navigateTo({
          url: '../search/search'
        })
      },
      fail(res) {
        console.log(res)
      }
    })
  },
  SendCleanTap: function() {
    this.setData({
      inputText: ''
    })
  },
  AlreadySendCleanTap: function() {
    this.setData({
      alreadySendText: ''
    })
  },
  RecvCleanTap: function () {
    this.setData({
      receiveText: ''
    })
  },
  SendValue:function(e){
    this.setData({
      inputText:e.detail.value
    })
  },
  getNowTime: function() {
    // 加0
    function add_10(num) {
      if (num < 10) {
        num = '0' + num
      }
      return num;
    }
    var myDate = new Date();
    myDate.getYear(); //获取当前年份(2位)
    myDate.getFullYear(); //获取完整的年份(4位,1970-????)
    myDate.getMonth(); //获取当前月份(0-11,0代表1月)
    myDate.getDate(); //获取当前日(1-31)
    myDate.getDay(); //获取当前星期X(0-6,0代表星期天)
    myDate.getTime(); //获取当前时间(从1970.1.1开始的毫秒数)
    myDate.getHours(); //获取当前小时数(0-23)
    myDate.getMinutes(); //获取当前分钟数(0-59)
    myDate.getSeconds(); //获取当前秒数(0-59)
    myDate.getMilliseconds(); //获取当前毫秒数(0-999)
    myDate.toLocaleDateString(); //获取当前日期
    var nowTime = '[' + add_10(myDate.getHours()) + ':' + add_10(myDate.getMinutes()) + ':' + add_10(myDate.getSeconds()) + 
      ']' + ' 收到';
    return nowTime;
  }
})