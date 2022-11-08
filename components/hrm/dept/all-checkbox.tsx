import React, { useContext, useMemo } from "react";
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import { useAppSelector } from "@reducers";
import { useGetHrmDeptBackendIDsQuery, useHrmDeptSelectAllMutation } from "./reducers/api";
import { backendDeptFilterSelector } from "./reducers/slice";
import { getAllCheckboxSelector } from "../functions";
import { EditModeContext } from ".";

const AllCheckBox = ()=>{
    const 
        {editMode} = useContext(EditModeContext),
        [selectAll] = useHrmDeptSelectAllMutation(),
        onChange = () => selectAll(),
        filterSelector = useMemo(()=>backendDeptFilterSelector(),[]),
        filters = useAppSelector(state => filterSelector(state)),
        checkboxSelector = useMemo(()=>getAllCheckboxSelector(),[]),
        {someChecked,allChecked} = useGetHrmDeptBackendIDsQuery(filters,{
            selectFromResult:({currentData}) => checkboxSelector(!!currentData ? currentData : [])
        })

    return (
        <TableCell padding="checkbox" sx={{display:editMode ? 'block' : 'none'}}>
            <Checkbox
                color="primary"
                indeterminate={someChecked}
                checked={allChecked}
                onChange={onChange}
            />
        </TableCell>
    )
}

export default AllCheckBox