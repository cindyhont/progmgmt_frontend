import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    return {
        props:{
            headers:req.headers,
            api:process.env.NEXT_PUBLIC_SSR_API_URL
        }
    }
}

const TestPage = ({headers,api}:{headers:any;api:string;}) => {
    useEffect(()=>{
        console.log(headers)
        console.log(api)
    },[])
    return <></>
}

export default TestPage