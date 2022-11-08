import React, { useContext, useMemo } from "react";
import Checkbox from '@mui/material/Checkbox';
import { useAppSelector } from "@reducers";
import { useGetHrmStaffBackendIDsQuery, useHrmStaffSelectAllMutation } from "./reducers/api";
import TableCell from '@mui/material/TableCell';
import { backendStaffFilterSelector } from "../staff/reducers/slice";
import { getAllCheckboxSelector } from "../functions";
import { EditModeContext } from ".";

const AllCheckBox = ()=>{
    const 
        filterSelector = useMemo(()=>backendStaffFilterSelector(),[]),
        filters = useAppSelector(state => filterSelector(state)),
        {editMode} = useContext(EditModeContext),
        checkboxSelector = useMemo(()=>getAllCheckboxSelector(),[]),
        {someChecked,allChecked} = useGetHrmStaffBackendIDsQuery(filters,{
            selectFromResult:({currentData}) => checkboxSelector(!!currentData ? currentData : [])
        }),
        [selectAll] = useHrmStaffSelectAllMutation(),
        onChange = () => selectAll()

    return (
        <TableCell padding="checkbox" sx={{display:editMode ? 'table-cell' : 'none'}}>
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