'use client'

import type { FC } from 'react'
import { CameraOutlined, DeleteOutlined } from '@ant-design/icons'
import { App, Upload } from 'antd'
import ImgCrop from 'antd-img-crop'
import { useTranslations } from 'next-intl'
import { useCvEditorStore } from '@store/cvs/single/store'
import { fileToPhotoDataUrl } from '@helpers/image'
import { reportError } from '@helpers/reportError'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/**
 * The photo slot in the editor: click to choose and crop, hover to remove. The cropped
 * image is shrunk to a ~50KB JPEG data URL and stored in the document — no upload endpoint.
 */
export const PhotoEditor: FC<{ photo: string | null; initials: string }> = ({ photo, initials }) => {
  const t = useTranslations('Editor.photo')
  const setPhoto = useCvEditorStore.use.setPhoto()
  const { message } = App.useApp()

  return (
    <div className='group relative size-full'>
      <ImgCrop aspect={1} quality={0.92} rotationSlider showReset modalTitle={t('cropTitle')} cropShape='round' showGrid>
        <Upload
          accept='image/png,image/jpeg,image/webp'
          showUploadList={false}
          className='block size-full [&_.ant-upload]:block [&_.ant-upload]:size-full'
          beforeUpload={(file) => {
            if (file.size > MAX_UPLOAD_BYTES) {
              message.error(t('tooLarge'))
              return Upload.LIST_IGNORE
            }
            fileToPhotoDataUrl(file)
              .then(setPhoto)
              .catch((error: unknown) => {
                reportError(error, 'editor:photo')
                message.error(t('failed'))
              })
            return false
          }}
        >
          <button
            type='button'
            className='relative grid size-full cursor-pointer place-items-center overflow-hidden border-0 p-0'
            // currentColor is the column's own text colour, so the slot reads on any background.
            style={{ background: 'color-mix(in srgb, currentColor 16%, transparent)', color: 'inherit' }}
            aria-label={photo ? t('change') : t('upload')}
          >
            {photo ? (
              <img src={photo} alt='' className='size-full object-cover' />
            ) : (
              <span className='font-[family-name:var(--cv-font-heading)] text-[2.2em] font-bold'>{initials || <CameraOutlined />}</span>
            )}
            <span className='absolute inset-0 grid place-items-center bg-black/45 text-[13px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100'>
              <span className='flex flex-col items-center gap-1' style={{ fontFamily: 'var(--font-ui), sans-serif' }}>
                <CameraOutlined className='text-lg' />
                {photo ? t('change') : t('upload')}
              </span>
            </span>
          </button>
        </Upload>
      </ImgCrop>
      {photo && (
        <button
          type='button'
          className='absolute right-1 bottom-1 hidden size-7 cursor-pointer place-items-center rounded-full border-0 bg-red-500 text-white shadow group-hover:grid'
          aria-label={t('remove')}
          title={t('remove')}
          onClick={() => setPhoto(null)}
        >
          <DeleteOutlined />
        </button>
      )}
    </div>
  )
}
