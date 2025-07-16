import React from 'react'
import Image from 'next/image'

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo parpadeante */}
        <div className="mb-6 animate-pulse">
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
        </div>
        
        {/* Texto de carga */}
        {/* <p className="text-lg font-medium text-gray-600 mb-4">
          Cargando...
        </p> */}
        
        {/* Spinner adicional */}
        {/* <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div> */}
      </div>
    </div>
  )
}

export default Loading