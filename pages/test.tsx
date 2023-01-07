import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    let json:any = null
    try {
        const response = await fetch(process.env.NEXT_PUBLIC_SSR_API_URL, {
            headers: { 
                'Content-Type': 'application/json',
            },
        })
        json = await response.json()
    } catch {}

    return {
        props:{
            headers:req.headers,
            api:process.env.NEXT_PUBLIC_SSR_API_URL,
            json
        }
    }
}

const TestPage = ({headers,api,json}:{headers:any;api:string;json:any}) => {
    useEffect(()=>{
        console.log(headers)
        console.log(api)
        console.log(json)
    },[])
    return <></>
}

export default TestPage