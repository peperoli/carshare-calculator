import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Modal({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDialogElement | null>(null)
  const closeModal = () => setIsOpen(false)
  const triggerProps = { className: 'block w-full', onClick: () => setIsOpen(true) }

  useEffect(() => {
    if (isOpen) {
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [isOpen])

  return (
    <>
      <button {...triggerProps}>{trigger}</button>
      <dialog ref={ref} onCancel={closeModal} className="w-full max-w-xl top-auto py-8 px-4 bg-white dark:bg-gray-900 backdrop:bg-black/50">
        {children}
        <button onClick={closeModal} className="absolute top-4 right-4">
          Cancel
        </button>
      </dialog>
    </>
  )
}
