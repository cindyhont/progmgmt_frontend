import React, { memo, useEffect, useRef, useState, useMemo } from "react";
import TableBody from '@mui/material/TableBody';
import { useAppSelector } from "@reducers";
import { useGetHrmDeptFrontendListQuery } from "./reducers/api";
import Row from "./body-row";
import { frontendDeptFilterSelector } from "./reducers/slice";

const Body = memo(() => {
    const 
        filterSelector = useMemo(()=>frontendDeptFilterSelector(),[]),
        filters = useAppSelector(state=>filterSelector(state)),
        [idsBuffer,setIDsBuffer] = useState<string[]>([]),
        {ids,isFetching} = useGetHrmDeptFrontendListQuery(filters,{
            selectFromResult:({currentData,isFetching}) => ({
                ids:currentData ? currentData.map(({id})=>id) : [],
                isFetching,
            })
        }),
        timeout = useRef<NodeJS.Timeout>()

    useEffect(()=>{
        if (!isFetching) {
            if (ids.length !== 0){
                clearTimeout(timeout.current)
                setIDsBuffer([...ids])
            } else timeout.current = setTimeout(()=>setIDsBuffer([]),300)
        }
    },[isFetching,ids.length])

    return (
        <TableBody>
            {idsBuffer.map(id=>(
                <Row id={id} key={id} />
            ))}
        </TableBody>
    )
})

Body.displayName = 'Body'
export default Body