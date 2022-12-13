import React, { memo, useContext, useMemo } from "react";
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import constants from "../../constants";
import BodyRowTextField from "./body-row-textfield";
import BodyRowAutocomplete from "./body-row-autocomplete";
import UserRightsCheckBox from "./body-row-user-rights";
import BodyRowDate from "./body-row-date";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "@reducers";
import { useGetHrmStaffBackendIDsQuery, useUpdateHrmStaffRowCheckboxMutation } from "./reducers/api";
import { backendStaffFilterSelector } from "./reducers/slice";
import { EditModeContext } from ".";

const 
    textfieldFields = [
        'staff_id',
        'first_name',
        'last_name',
        'title',
        'email',
    ] as ('staff_id'|'first_name'|'last_name'|'title'|'email')[],
    automcompleteFields = [
        'department_id',
        'supervisor_id',
    ] as ('department_id' | 'supervisor_id')[],
    dateArr = [
        {field:'last_active_dt',emptyMsg:''},
        {field:'date_registered_dt',emptyMsg:'Never registered'},
        {field:'last_invite_dt',emptyMsg:'Never invited'},
    ],
    BodyRow = memo(({id}:{id:string}) => {
        return (
            <RowWrapper id={id}>
                <>
                <RowCheckbox id={id} />
                {textfieldFields.map((field,i)=>(
                    <RowCell idx={i} align='inherit' key={i}>
                        <BodyRowTextField {...{id,field}} />
                    </RowCell>
                ))}
                {automcompleteFields.map((field,i)=>(
                    <RowCell idx={i + textfieldFields.length} align='inherit' key={i}>
                        <BodyRowAutocomplete {...{id,field}} />
                    </RowCell>
                ))}
                {constants.userRights.map((_,i)=>(
                    <RowCell idx={i + textfieldFields.length + automcompleteFields.length} align='center' key={i}>
                        <UserRightsCheckBox id={id} idx={i} />
                    </RowCell>
                ))}
                {dateArr.map((
                    {
                        field,
                        emptyMsg
                    }:{
                        field:'last_invite_dt'|'date_registered_dt'|'last_active_dt';
                        emptyMsg:string;
                    },
                    i
                )=>(
                    <RowCell idx={i + textfieldFields.length + automcompleteFields.length + constants.userRights.length} align='inherit' key={i}>
                        <BodyRowDate {...{id,field,emptyMsg}} />
                    </RowCell>
                ))}
                </>
            </RowWrapper>
        )
    }),
    RowCell = memo((
        {
            idx,
            align,
            children
        }:{
            idx:number;
            align:'center'|'inherit';
            children:JSX.Element;
        }
    )=>{
        const show = useAppSelector(state => state.hrmStaff.columnVisibility & Math.pow(2,idx),shallowEqual)
        return (
            <TableCell 
                align={align} 
                sx={{
                    py:1,
                    display:show ? 'table-cell' : 'none',
                    height:72
                }}
            >
                {children}
            </TableCell>
        )
    }),
    RowCheckbox = memo(({id}:{id:string})=>{
        const 
            backEndSelector = useMemo(()=>backendStaffFilterSelector(),[]),
            filters = useAppSelector(state => backEndSelector(state)),
            {selected} = useGetHrmStaffBackendIDsQuery(filters,{
                selectFromResult:({currentData}) => ({
                    selected:currentData 
                        ? currentData.find(d=>d.id===id)?.selected === true
                        : false
                })
            }),
            {editMode} = useContext(EditModeContext),
            [selectCheckbox] = useUpdateHrmStaffRowCheckboxMutation(),
            onChange = () => selectCheckbox(id)
            
        return (
            <TableCell padding="checkbox" sx={{display:editMode ? 'table-cell' : 'none'}}>
                <Checkbox
                    color="primary"
                    checked={selected}
                    onChange={onChange}
                />
            </TableCell>
        )
    }),
    RowWrapper = memo((
        {
            id,
            children
        }:{
            id:string;
            children:JSX.Element;
        }
    )=>{
        const
            backEndSelector = useMemo(()=>backendStaffFilterSelector(),[]),
            filters = useAppSelector(state => backEndSelector(state)),
            {selected} = useGetHrmStaffBackendIDsQuery(filters,{
                selectFromResult:({currentData}) => ({
                    selected:currentData 
                        ? currentData.find(d=>d.id===id)?.selected === true
                        : false
                })
            })
        return (
            <TableRow selected={selected}>
                {children}
            </TableRow>
        )
    })

BodyRow.displayName = 'BodyRow'
RowCheckbox.displayName = 'RowCheckbox'
RowCell.displayName = 'RowCell'
RowWrapper.displayName = 'RowWrapper'
export default BodyRow