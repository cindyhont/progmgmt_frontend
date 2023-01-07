import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    let links:any = null
    try {
        const 
            testLink = (url:string) => new Promise<string>(resolve=>{
                fetch(url)
                .then(()=>resolve(url))
                .catch(()=>resolve(''))
            })
        links = await Promise.all([
            testLink(process.env.NEXT_PUBLIC_SSR_API_URL_A),
            testLink(process.env.NEXT_PUBLIC_SSR_API_URL_B),
        ])
    } catch {}

    return {
        props:{
            headers:req.headers,
            api:process.env.NEXT_PUBLIC_SSR_API_URL,
            links
        }
    }
}

const TestPage = ({headers,api,links}:{headers:any;api:string;links:any}) => {
    useEffect(()=>{
        console.log(headers)
        console.log(api)
        console.log(links)
    },[])
    return <></>
}

export default TestPage