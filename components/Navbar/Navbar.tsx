import Link from 'next/link'
import React from 'react'

const Navbar = () => {
    return (
        <div className='flex mx-10 my-6'>
            <Link href={"/"}>
            <h1 className='text-white text-2xl font-bold hover:text-cyan-500'><span className='text-cyan-500'>Kira</span> Topup Store</h1>
            
            </Link>
        </div>
    )
}

export default Navbar 