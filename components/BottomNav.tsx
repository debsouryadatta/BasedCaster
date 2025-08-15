'use client'

import Link from 'next/link'
import { HomeIcon, ChatBubbleOvalLeftEllipsisIcon, UserCircleIcon } from '@heroicons/react/24/solid'

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-xl px-3">
        <div className="h-14 rounded-t-3xl bg-indigo-600 flex items-center justify-around shadow-2xl">
          <Link href="/" className="p-2 rounded-full text-white focus:outline-none active:opacity-80">
            <HomeIcon className="h-6 w-6" />
          </Link>
          <Link href="/create" className="p-2 rounded-full text-white focus:outline-none active:opacity-80">
            <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
          </Link>
          <Link href="/web" className="p-2 rounded-full text-white focus:outline-none active:opacity-80">
            <UserCircleIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </nav>
  )
}


