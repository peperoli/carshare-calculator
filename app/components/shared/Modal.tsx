import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Modal({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDialogElement | null>(null)
  const closeModal = () => setIsOpen(false)
  const triggerProps = { onClick: () => setIsOpen(true) }

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
      <dialog ref={ref} onCancel={closeModal} className="p-4">
        {children}
        <button onClick={closeModal}>Cancel</button>
      </dialog>
    </>
  )
}
