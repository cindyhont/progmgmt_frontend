import React, { memo, useEffect, useRef, useState, useMemo } from "react";
import TableBody from '@mui/material/TableBody';
import { useAppSelector } from "@reducers";
import { shallowEqual } from "react-redux";
import BodyRow from "./body-row";
import { useGetHrmStaffFrontendListQuery } from "./reducers/api";
import { frontendStaffFilterSelector } from "./reducers/slice";

const Body = memo(()=>{
    const
        frontEndSelector = useMemo(()=>frontendStaffFilterSelector(),[]),
        filters = useAppSelector(state => frontEndSelector(state),shallowEqual),
        [idsBuffer,setIDsBuffer] = useState<string[]>([]),
        {ids,isFetching} = useGetHrmStaffFrontendListQuery(filters,{
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
                <BodyRow key={id} id={id} />
            ))}
        </TableBody>
    )
})

Body.displayName = 'Body'
export default Body