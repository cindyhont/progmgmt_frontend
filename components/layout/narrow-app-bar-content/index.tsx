import { useRouter } from "next/router";
import React from "react";
import TaskAppBar from "./tasks";

const NarrowAppBarContent = () => {
    const
        {query} = useRouter(),
        page = query.page as string

    return (
        <>
        {page==='tasks' && <TaskAppBar />}
        </>
    )
}

export default NarrowAppBarContent