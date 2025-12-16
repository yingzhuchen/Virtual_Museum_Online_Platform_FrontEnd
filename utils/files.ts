interface SelectFileOptions {
  /** 限制图片大小，单位 MB */
  maxSize?: number
  /** 返回数据的类型，默认为 `file` */
  returnType?: 'base64' | 'file'
  /** 允许选择的文件类型 */
  accept?: string
}

/** 让用户选择一张图片，并返回图片的 Base64 字符串。 */
export async function selectFile(
  options: SelectFileOptions & { returnType: 'base64' },
): Promise<string>
export async function selectFile(options?: SelectFileOptions): Promise<File>

export async function selectFile(options?: SelectFileOptions): Promise<string | File> {
  return new Promise<string | File>((resolve, reject) => {
    const { onChange, open } = useFileDialog({
      accept: options?.accept,
      multiple: false,
    })
    onChange((fileList) => {
      if ( !fileList?.length) {
        reject(new Error('未选择任何文件'))
        return
      }
      const file = fileList[0]!

      if (options?.maxSize && file.size > options.maxSize * 1024 * 1024) {
        reject(new Error(`文件大小超过限制，最大 ${options.maxSize} MB`))
        return
      }

      if (options?.returnType === 'base64') {
        return fileToBase64(file).then(resolve, reject)
      }

      resolve(file)
    })
    open()
  })
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsDataURL(file)
  })
}
