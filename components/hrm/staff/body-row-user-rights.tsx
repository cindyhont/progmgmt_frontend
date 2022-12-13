import React, { memo, useContext, useMemo } from "react";
import Checkbox from '@mui/material/Checkbox';
import { useAppSelector } from "@reducers";
import { useGetHrmStaffFrontendListQuery, useUpdateHrmStaffActiveMutation } from "./reducers/api";
import { createSelector } from "@reduxjs/toolkit";
import { IhrmStaffFrontendItem } from "../interfaces";
import { frontendStaffFilterSelector } from "./reducers/slice";
import { EditModeContext } from ".";

const UserRightsCheckBox = memo((
    {
        id,
        idx
    }:{
        id:string;
        idx:number;
    }
)=>{
    const 
        frontEndSelector = useMemo(()=>frontendStaffFilterSelector(),[]),
        filters = useAppSelector(state => frontEndSelector(state)),
        factor = useMemo(()=>Math.pow(2,idx),[]),
        {editMode} = useContext(EditModeContext),
        selector = useMemo(()=>createSelector(
            (res:IhrmStaffFrontendItem[]) => res.find(d=>d.id===id),
            (res:IhrmStaffFrontendItem) => ({
                userRight:!!res ? res.user_right : 0,
                checked:!!res ? (res.user_right & factor) !== 0 : false
            })
        ),[]),
        {userRight,checked} = useGetHrmStaffFrontendListQuery(filters,{
            selectFromResult:({currentData}) => currentData ? selector(currentData) : {userRight:0,checked:false}
        }),
        [updateField] = useUpdateHrmStaffActiveMutation(),
        onChange = async() => {
            if (!editMode) return
            try {
                await updateField({
                    id,
                    field:'user_right',
                    value:checked ? userRight - factor : userRight + factor
                })
            } catch {}
        }

    return (
        <Checkbox
            checked={checked}
            onChange={onChange}
        />
    )
})

UserRightsCheckBox.displayName = 'UserRightsCheckBox'
export default UserRightsCheckBox