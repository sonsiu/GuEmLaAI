export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const result = reader.result?.toString() ?? ''
      const base64 = result.includes(',') ? result.split(',')[1] : result

      resolve(base64)
    }


    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

