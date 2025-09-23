export {}

declare global {
  interface DocumentPictureInPictureOptions {
    width?: number
    height?: number
  }

  interface DocumentPictureInPicture {
    requestWindow: (options?: DocumentPictureInPictureOptions) => Promise<Window>
    window?: Window
  }

  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture
  }
}
