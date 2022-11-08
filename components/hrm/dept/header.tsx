import React, { useContext } from "react";
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import AllCheckBox from "./all-checkbox";
import { useAppDispatch, useAppSelector } from "@reducers";
import { shallowEqual } from "react-redux";
import { reorder } from "./reducers/slice";
import { ThrmDeptColumn } from "../interfaces";
import { EditModeContext } from ".";

const 
    Header = ()=>(
        <TableHead>
            <TableRow sx={{height:'48px'}}>
                <AllCheckBox />
                <TableCell 
                    align='center' 
                    sx={{py:1,minWidth:150}}
                >
                    <SortLabel label='internal_id' name='ID' />
                </TableCell>
                <TableCell sx={{py:1,minWidth:400}}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}
                    >
                        <SortLabel label='name' name='Department Name' />
                    </div>
                </TableCell>
            </TableRow>
        </TableHead>
    ),
    SortLabel = ({label,name}:{label:ThrmDeptColumn;name:string;}) => {
        const 
            dispatch = useAppDispatch(),
            sortBy = useAppSelector(state => state.hrmDept.sortBy,shallowEqual),
            sortOrder = useAppSelector(state => state.hrmDept.sortOrder,shallowEqual),
            {editMode} = useContext(EditModeContext),
            onClick = () => dispatch(reorder(label))
            
        return (
            <TableSortLabel
                active={sortBy===label}
                direction={sortBy===label ? sortOrder : 'asc'}
                onClick={onClick}
                sx={{
                    pl:label==='name' && editMode ? 1.8 : label ==='internal_id' && !editMode ? 3.5 : 0
                }}
            >
                {name}
            </TableSortLabel>
        )
    }

export default Header