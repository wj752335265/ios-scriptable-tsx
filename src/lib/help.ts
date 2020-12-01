import {Config} from '@app/@types/scriptable/config'

/**网络请求参数*/
export interface RequestParams {
  /**链接*/
  url: string

  /**数据*/
  data?: unknown

  /**请求头*/
  header?: Record<string, string>

  /**请求方式*/
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'TRACE' | 'CONNECT'

  /**超时报错，单位毫秒，默认60秒*/
  timeout?: number

  /**返回的类型，默认是json解析出来的对象*/
  dataType?: 'json' | 'text' | 'image' | 'data'

  /**是否使用缓存（永久缓存）*/
  useCache?: boolean
}

/**网络响应格式*/
export interface ResponseType<RES = unknown> {
  /**链接*/
  url: string

  /**响应码*/
  statusCode: number

  /**响应类型*/
  mimeType: string

  /**文字编码*/
  textEncodingName: string

  /**响应头*/
  headers: Record<string, string>

  /**cookie*/
  cookies: {
    path: string
    httpOnly: boolean
    domain: string
    sessionOnly: boolean
    name: string
    value: string
  }[]

  /**主体响应内容*/
  data: RES | null
}

/**上传文件参数*/
export interface UploadFileParams {
  /**链接*/
  url: string

  /**文件路径*/
  filePath: string | Image

  /**文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容*/
  name: string

  /**文件名字*/
  filename?: string

  /**请求头*/
  header?: Record<string, string>

  /**HTTP 请求中其他额外的 form data*/
  formData?: Record<string, string>

  /**超时报错，单位毫秒，默认60秒*/
  timeout?: number

  /**返回的类型，默认是json解析出来的对象*/
  dataType?: 'json' | 'text' | 'image' | 'data'
}

/**选择弹窗参数*/
export interface ShowActionSheetParams {
  /**标题*/
  title?: string

  /**描述*/
  desc?: string

  /**取消文字*/
  cancelText?: string

  /**每个选择*/
  itemList:
    | {
        /**文字*/
        text: string

        /** wran 的话就会标红文字 */
        type?: 'normal' | 'warn'
      }[]
    | string[]
}

/**提示、警告弹窗参数*/
export interface ShowModalParams {
  /**标题*/
  title?: string

  /**内容*/
  content?: string

  /**输入框列表*/
  inputItems?: {
    /** password 的话就会隐藏文字 */
    type?: 'text' | 'password'

    /**默认文字*/
    text?: string

    /**提示文字*/
    placeholder?: string
  }[]

  /**是否显示取消*/
  showCancel?: boolean

  /**取消文字*/
  cancelText?: string

  /**确定文字*/
  confirmText?: string
}

/**提示、警告弹窗响应体*/
export interface ShowModalRes {
  /**是否确定*/
  confirm: boolean

  /**是否取消*/
  cancel: boolean

  /**输入的文字列表*/
  texts: string[]
}

/**获取图片所需参数*/
export interface GetImageParams {
  /**文件路径*/
  filepath?: string

  /**网络路径*/
  url?: string

  /**当通过网络获取时，是否缓存下来*/
  useCache?: boolean
}

/**创建通知所需参数 */
export interface ShowNotificationParams {
  /**标题*/
  title: string

  /**副标题*/
  subtitle?: string

  /**内容*/
  body?: string

  /**通知铃声*/
  sound?: 'default' | 'accept' | 'alert' | 'complete' | 'event' | 'failure' | 'piano_error' | 'piano_success' | 'popup'

  /**点击通知后打开的url*/
  openURL?: string

  [key: string]: unknown
}

/**
 * 根据文件保存路径生成储存方法、读取方法
 * @param dirPath 文件存储文件夹
 */
function setStorageDirectory(dirPath: string) {
  return {
    /**
     * 保存值
     * @param key 键
     * @param value 值
     */
    setStorage(key: string, value: unknown): void {
      const hashKey = hash(key)
      // 图片文件只缓存一段时间
      const filePath = FileManager.local().joinPath(dirPath, hashKey)
      if (value instanceof Image) {
        // value 是图片
        FileManager.local().writeImage(filePath, value as Image)
        return
      }
      if (value instanceof Data) {
        // value 是文件
        FileManager.local().write(filePath, value as Data)
      }
      // 存在本脚本沙箱里，与脚本共存亡
      Keychain.set(hashKey, JSON.stringify(value))
    },

    /**
     * 获取值
     * @param key 键
     */
    getStorage<T = unknown>(key: string): T | null {
      const hashKey = hash(key)
      const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey)
      if (FileManager.local().fileExists(filePath)) {
        const image = Image.fromFile(filePath)
        const file = Data.fromFile(filePath)
        return image ? ((image as unknown) as T) : file ? ((file as unknown) as T) : null
      }

      if (Keychain.contains(hashKey)) {
        return JSON.parse(Keychain.get(hashKey)) as T
      } else {
        return null
      }
    },
    /**
     * 移除值
     * @param key 键
     */
    removeStorage(key: string): void {
      const hashKey = hash(key)
      const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey)
      if (FileManager.local().fileExists(filePath)) {
        FileManager.local().remove(hashKey)
      }
      if (Keychain.contains(hashKey)) {
        Keychain.remove(hashKey)
      }
    },
  }
}

/**
 * 长期保存值
 * @param key 键
 * @param value 值
 */
export const setStorage = setStorageDirectory(FileManager.local().libraryDirectory()).setStorage

/**
 * 获取长期保存值
 * @param key 键
 */
export const getStorage = setStorageDirectory(FileManager.local().libraryDirectory()).getStorage

/**
 * 移除长期保存值
 * @param key 键
 */
export const removeStorage = setStorageDirectory(FileManager.local().libraryDirectory()).removeStorage

/**
 * 短期保存值(缓存文件用)
 * @param key 键
 * @param value 值
 */
export const setCache = setStorageDirectory(FileManager.local().temporaryDirectory()).setStorage

/**
 * 获取短期保存值(读取缓存文件用)
 * @param key 键
 */
export const getCache = setStorageDirectory(FileManager.local().temporaryDirectory()).getStorage

/**
 * 移除短期保存值(移除缓存文件用)
 * @param key 键
 */
export const removeCache = setStorageDirectory(FileManager.local().temporaryDirectory()).removeStorage

/**
 * 生成设置存储和读取方法
 * @param settingFilename 保存的设置文件名字，取独特一点，防止和别人冲突
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useSetting = (settingFilename?: string) => {
  /**当前脚本所处的文件夹是否在icloud里*/
  const isUseICloud = (): boolean => {
    return MODULE.filename.includes('Documents/iCloud~')
  }

  /**获取当前文件夹管理对象*/
  const getCurrentFileManager = (): FileManager => {
    return isUseICloud() ? FileManager.iCloud() : FileManager.local()
  }

  /**生成设置文件名*/
  const generateSettingFileName = (): string => {
    return MODULE.filename.match(/[^\/]+$/)?.[0].replace('.js', '') || hash(`settings:${MODULE.filename}`)
  }

  // 当前脚本是不是在 icloud
  const isICloud = isUseICloud()

  // 当前文件管理对象
  const fileManager = getCurrentFileManager()

  // 设置保存文件夹
  const settingsFolderPath = fileManager.joinPath(fileManager.documentsDirectory(), '/settings-json')

  // 设置保存文件名
  const _settingFilename = `${settingFilename || generateSettingFileName()}.json`

  // 文件储存路径
  const settingsPath = fileManager.joinPath(settingsFolderPath, _settingFilename)

  /**确保设置文件存在*/
  const isFileExists = async (): Promise<boolean> => {
    if (!fileManager.fileExists(settingsFolderPath)) {
      fileManager.createDirectory(settingsFolderPath, true)
    }
    if (!fileManager.fileExists(settingsPath)) {
      await fileManager.writeString(settingsPath, '{}')
      return false
    }
    return true
  }

  /**读取设置*/
  const getSettings = async <T>(key: string): Promise<null | T> => {
    const fileExists = await isFileExists()
    if (!fileExists) return null
    if (isICloud) await fileManager.downloadFileFromiCloud(settingsPath)
    const json = fileManager.readString(settingsPath)
    const settings = JSON.parse(json) || {}
    return settings[key] as T
  }

  /**保存设置*/
  const setSettings = async (key: string, value: unknown): Promise<Record<string, unknown> | void> => {
    const fileExists = await isFileExists()
    if (!fileExists) {
      await fileManager.writeString(
        settingsPath,
        JSON.stringify({
          [key]: value,
        }),
      )
      return
    }
    if (isICloud) await fileManager.downloadFileFromiCloud(settingsPath)
    const json = fileManager.readString(settingsPath)
    const settings = JSON.parse(json) || {}
    settings[key] = value
    await fileManager.writeString(settingsPath, JSON.stringify(settings))
    return settings
  }

  return {getSettings, setSettings}
}

/**
 * 发起请求
 * @param args 请求参数
 */
export async function request<RES = unknown>(args: RequestParams): Promise<ResponseType<RES>> {
  const {url, data, header, dataType = 'json', method = 'GET', timeout = 60 * 1000, useCache = false} = args
  const cacheKey = `url:${url}`
  const cache = getStorage(cacheKey) as ResponseType<RES>
  if (useCache && cache !== null) return cache
  const req = new Request<RES>(url)
  req.method = method
  header && (req.headers = header)
  data && (req.body = data)
  req.timeoutInterval = timeout / 1000
  req.allowInsecureRequest = true
  let res
  try {
    switch (dataType) {
      case 'json':
        res = await req.loadJSON()
        break
      case 'text':
        res = await req.loadString()
        break
      case 'image':
        res = await req.loadImage()
        break
      case 'data':
        res = await req.load()
        break
      default:
        res = await req.loadJSON()
    }
    const result = {...req.response, data: res as RES} as ResponseType<RES>
    setStorage(cacheKey, result)
    return result
  } catch (err) {
    if (cache !== null) return cache
    return err
  }
}

/**
 * 上传文件
 * @param args 上传文件参数
 */
export async function uploadFile<RES = unknown>(args: UploadFileParams): Promise<ResponseType<RES>> {
  const {
    url,
    filePath,
    name,
    dataType = 'json',
    filename = new Date().getTime(),
    header,
    formData = {},
    timeout = 60 * 1000,
  } = args
  const req = new Request(url)
  header && (req.headers = header)
  req.timeoutInterval = timeout / 1000
  if (typeof filePath === 'string') {
    req.addFileToMultipart(filePath, name, String(filename))
  } else {
    req.addImageToMultipart(filePath, name, String(filename))
  }
  Object.keys(formData).forEach(key => {
    req.addParameterToMultipart(key, formData[key])
  })
  let res
  try {
    switch (dataType) {
      case 'json':
        res = await req.loadJSON()
        break
      case 'text':
        res = await req.loadString()
        break
      case 'image':
        res = await req.loadImage()
        break
      case 'data':
        res = await req.load()
        break
      default:
        res = await req.loadJSON()
    }

    return {...req.response, data: res as RES} as ResponseType<RES>
  } catch (err) {
    return err
  }
}

/**
 * 弹出选择弹窗
 * @param args 弹窗参数
 */
export async function showActionSheet(args: ShowActionSheetParams): Promise<number> {
  const {title, desc, cancelText = '取消', itemList} = args
  const alert = new Alert()
  title && (alert.title = title)
  desc && (alert.message = desc)
  for (const item of itemList) {
    if (typeof item === 'string') {
      alert.addAction(item)
    } else {
      switch (item.type) {
        case 'normal':
          alert.addAction(item.text)
          break
        case 'warn':
          alert.addDestructiveAction(item.text)
          break
        default:
          alert.addAction(item.text)
          break
      }
    }
  }
  alert.addCancelAction(cancelText)
  const tapIndex = await alert.presentSheet()
  return tapIndex
}

/**
 * 弹出提示、警告弹窗
 * @param args 弹窗参数
 */
export async function showModal(args: ShowModalParams): Promise<ShowModalRes> {
  /**确定与取消*/
  const {title, content, showCancel = true, cancelText = '取消', confirmText = '确定', inputItems = []} = args
  const alert = new Alert()
  title && (alert.title = title)
  content && (alert.message = content)
  showCancel && cancelText && alert.addCancelAction(cancelText)
  alert.addAction(confirmText)

  /**文字弹窗*/
  for (const input of inputItems) {
    const {type = 'text', text = '', placeholder = ''} = input
    if (type === 'password') {
      alert.addSecureTextField(placeholder, text)
    } else {
      alert.addTextField(placeholder, text)
    }
  }

  /**点击确定和取消的 index */
  const tapIndex = await alert.presentAlert()

  /**获取输入框的值列表*/
  const texts = inputItems.map((item, index) => alert.textFieldValue(index))
  return tapIndex === -1
    ? {
        cancel: true,
        confirm: false,
        texts,
      }
    : {
        cancel: false,
        confirm: true,
        texts,
      }
}

/**
 * 创建通知
 * @param args 通知参数
 */
export async function showNotification(args: ShowNotificationParams): Promise<void> {
  const {title, subtitle = '', body = '', openURL, sound = 'default', ...others} = args
  let notification = new Notification()
  notification.title = title
  notification.subtitle = subtitle
  notification.body = body
  openURL && (notification.openURL = openURL)
  notification.sound = sound
  notification = Object.assign(notification, others)
  return await notification.schedule()
}

/**
 * 多方式获取图片
 * @param args 获取图片所需参数
 */
export async function getImage(args: GetImageParams): Promise<Image> {
  const {filepath, url, useCache = true} = args
  const generateDefaultImage = async () => {
    // 没有缓存+失败情况下，返回自定义的绘制图片（红色背景）
    const ctx = new DrawContext()
    ctx.size = new Size(100, 100)
    ctx.setFillColor(Color.red())
    ctx.fillRect(new Rect(0, 0, 100, 100))
    return await ctx.getImage()
  }
  try {
    if (filepath) {
      return Image.fromFile(filepath) || (await generateDefaultImage())
    }
    if (!url) return await generateDefaultImage()
    const cacheKey = `image:${url}`
    if (useCache) {
      const cache = getCache<Image>(url)
      if (cache instanceof Image) {
        return cache
      } else {
        removeCache(cacheKey)
      }
    }
    const res = await request<Image>({url, dataType: 'image'})
    const image = res && res.data
    image && setCache(cacheKey, image)
    return image || (await generateDefaultImage())
  } catch (err) {
    return await generateDefaultImage()
  }
}

/**
 * base64 编码字符串
 * @param str 要编码的字符串
 */
export function base64Encode(str: string): string {
  return Data.fromString(str).toBase64String()
}

/**
 * base64解码数据
 * @param base64 base64编码的数据
 */
export function base64Decode(base64: string): string {
  return Data.fromBase64String(base64).toRawString()
}

/**
 * 字符串转哈希
 * @param string 字符串
 */
export function hash(string: string): string {
  let hash = 0,
    i,
    chr
  for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return `hash_${hash}`
}

/**
 * 获取截图中的组件剪裁图
 * 可用作透明背景
 * 返回图片image对象
 *  @param tips 开始处理前提示用户截图的信息，可选（适合用在组件自定义透明背景时提示）
 */
export async function setTransparentBackground(tips?: string): Promise<Image | undefined> {
  type WidgetSize = NonNullable<Config['widgetFamily']>

  type PhoneSize = {
    [key in WidgetSize]: number
  } & {
    left: number
    right: number
    top: number
    middle: number
    bottom: number
  }

  const phoneSizea: Record<string, PhoneSize> = {
    // 12 pro max
    '2778': {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 96,
      right: 678,
      top: 246,
      middle: 882,
      bottom: 1518,
    },

    // 12 and 12 Pro
    '2532': {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 78,
      right: 618,
      top: 231,
      middle: 819,
      bottom: 1407,
    },

    // 11 Pro Max, XS Max
    '2688': {
      small: 507,
      medium: 1080,
      large: 1137,
      left: 81,
      right: 654,
      top: 228,
      middle: 858,
      bottom: 1488,
    },

    // 11, XR
    '1792': {
      small: 338,
      medium: 720,
      large: 758,
      left: 54,
      right: 436,
      top: 160,
      middle: 580,
      bottom: 1000,
    },

    // 11 Pro, XS, X
    '2436': {
      small: 465,
      medium: 987,
      large: 1035,
      left: 69,
      right: 591,
      top: 213,
      middle: 783,
      bottom: 1353,
    },

    // Plus phones
    '2208': {
      small: 471,
      medium: 1044,
      large: 1071,
      left: 99,
      right: 672,
      top: 114,
      middle: 696,
      bottom: 1278,
    },

    // SE2 and 6/6S/7/8
    '1334': {
      small: 296,
      medium: 642,
      large: 648,
      left: 54,
      right: 400,
      top: 60,
      middle: 412,
      bottom: 764,
    },

    // SE1
    '1136': {
      small: 282,
      medium: 584,
      large: 622,
      left: 30,
      right: 332,
      top: 59,
      middle: 399,
      bottom: 399,
    },

    // 11 and XR in Display Zoom mode
    '1624': {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902,
    },

    // Plus in Display Zoom mode
    '2001': {
      small: 444,
      medium: 963,
      large: 972,
      left: 81,
      right: 600,
      top: 90,
      middle: 618,
      bottom: 1146,
    },
  }

  /**
   * 裁剪图片
   * @param img 图片
   * @param rect 裁剪坐标集合
   */
  const cropImage = (img: Image, rect: Rect): Image => {
    const draw = new DrawContext()
    draw.size = new Size(rect.width, rect.height)
    draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y))
    return draw.getImage()
  }

  const shouldExit = await showModal({
    content: tips || '开始之前，请先前往桌面,截取空白界面的截图。然后回来继续',
    cancelText: '我已截图',
    confirmText: '前去截图 >',
  })

  if (!shouldExit.cancel) return

  const img = await Photos.fromLibrary()
  const imgHeight = img.size.height
  const phone = phoneSizea[imgHeight]
  if (!phone) {
    const help = await showModal({
      content: '好像您选择的照片不是正确的截图，或者您的机型我们暂时不支持。点击确定前往社区讨论',
      confirmText: '帮助',
      cancelText: '取消',
    })
    if (help.confirm) Safari.openInApp('https://support.qq.com/products/287371', false)
    return
  }

  const sizes = ['小尺寸', '中尺寸', '大尺寸']
  const sizeIndex = await showActionSheet({
    title: '你准备用哪个尺寸',
    itemList: sizes,
  })
  const widgetSize = sizes[sizeIndex]

  /**
   * 选择组件摆放位置
   * @param positions 位置列表
   */
  const selectLocation = (positions: string[]) =>
    showActionSheet({
      title: '你准备把组件放桌面哪里？',
      desc:
        imgHeight == 1136
          ? ' （备注：当前设备只支持两行小组件，所以下边选项中的「中间」和「底部」的选项是一致的）'
          : '',
      itemList: positions,
    })
  const crop = {w: 0, h: 0, x: 0, y: 0}
  let positions!: string[]
  let _positions: string[]
  let positionIndex: number
  let keys: WidgetSize[]
  let key: WidgetSize
  switch (widgetSize) {
    case '小尺寸':
      crop.w = phone.small
      crop.h = phone.small
      positions = ['左上角', '右上角', '中间左', '中间右', '左下角', '右下角']
      _positions = ['top left', 'top right', 'middle left', 'middle right', 'bottom left', 'bottom right']
      positionIndex = await selectLocation(positions)
      keys = _positions[positionIndex].split(' ') as WidgetSize[]
      crop.y = phone[keys[0]]
      crop.x = phone[keys[1]]
      break
    case '中尺寸':
      crop.w = phone.medium
      crop.h = phone.small
      crop.x = phone.left
      positions = ['顶部', '中间', '底部']
      _positions = ['top', 'middle', 'bottom']
      positionIndex = await selectLocation(positions)
      key = _positions[positionIndex] as WidgetSize
      crop.y = phone[key]
      break
    case '大尺寸':
      crop.w = phone.medium
      crop.h = phone.large
      crop.x = phone.left
      positions = ['顶部', '底部']
      _positions = ['top', 'bottom']
      positionIndex = await selectLocation(positions)
      key = _positions[positionIndex] as WidgetSize
      crop.y = phone[key]
      break
  }

  const imgCrop = cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h))
  return imgCrop
}