import { useRouter } from "next/router";
import React from "react";
import TaskAppBar from "./tasks";

const 
    WideAppBarContent = () => {
        const 
            router = useRouter(),
            page = router.query.page as string

        if (page==='tasks') return <TaskAppBar />
        else return <></>
    }

export default WideAppBarContent