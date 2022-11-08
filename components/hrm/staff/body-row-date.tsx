import { useAppSelector } from "@reducers";
import React, { memo, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { useGetHrmStaffFrontendListQuery } from "./reducers/api";
import { createFieldValueSelector, frontendStaffFilterSelector } from "./reducers/slice";

const BodyRowDate = memo((
    {
        id,
        field,
        emptyMsg,
    }:{
        id:string;
        field:'last_invite_dt'|'date_registered_dt'|'last_active_dt';
        emptyMsg:string;
    }
) => {
    const
        frontEndSelector = useMemo(()=>frontendStaffFilterSelector(),[]),
        filters = useAppSelector(state => frontEndSelector(state),shallowEqual),
        fieldValueSelector = useMemo(()=>createFieldValueSelector(id,field,0),[]),
        {value} = useGetHrmStaffFrontendListQuery(filters,{
            selectFromResult:({currentData}) => ({value:currentData ? fieldValueSelector(currentData) : 0})
        })
    return (
        <>
            {value !== 0
                ? new Date(value).toLocaleDateString('en-UK',{month:'short',day:'numeric',year:'numeric'})
                : emptyMsg}
        </>
    )
})

BodyRowDate.displayName = 'BodyRowDate'
export default BodyRowDate