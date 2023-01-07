import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({req:{headers:{host}}}) => {
    return {
        props:{
            host,
            api:process.env.NEXT_PUBLIC_SSR_API_URL
        }
    }
}

const TestPage = ({host,api}:{host:string;api:string;}) => {
    useEffect(()=>{
        console.log(host)
        console.log(api)
    },[])
    return <></>
}

export default TestPage