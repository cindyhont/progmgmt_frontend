import React from 'react'
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({req:{cookies},res}) => {
    if (cookies.hasOwnProperty('sid')) res.setHeader('Set-Cookie',['sid=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; httponly'])
    return {redirect:{destination:'/login',permanent:false}}
}

const Logout = () => <></>

export default Logout