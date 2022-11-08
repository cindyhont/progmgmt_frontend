import React, { memo } from 'react'
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { ThrmStaffColumns } from '../interfaces';
import { useAppDispatch, useAppSelector } from '@reducers';
import { reorder } from './reducers/slice';
import { shallowEqual } from "react-redux";
import AllCheckBox from './all-checkbox';
import { staffHeaderArr } from '../functions';

const 
    Head = memo(()=>(
        <TableHead>
            <TableRow>
                <AllCheckBox />
                {staffHeaderArr.map(({sx,name,label}:{sx:any;name:string;label?:ThrmStaffColumns},i)=>(
                    <HeaderCell key={i} {...{
                        sx,
                        name: name.startsWith('Rights to ') ? name.replace('Rights to ','').replace(name['Rights to '.length],name['Rights to '.length].toUpperCase()) : name,
                        label,
                        idx:i
                    }} />
                ))}
            </TableRow>
        </TableHead>
    )),
    HeaderCell = memo((
        {
            sx,
            name,
            idx,
            label,
        }:{
            sx:any;
            name:string;
            idx:number;
            label?:ThrmStaffColumns
        }
    )=>{
        const show = useAppSelector(state => state.hrmStaff.columnVisibility & Math.pow(2,idx),shallowEqual)
        return (
            <TableCell sx={{
                ...sx,
                display:show ? 'table-cell' : 'none'
            }}>
                {label && <SortLabel label={label} name={name} />}
                {!label && name}
            </TableCell>
        )
    }),
    SortLabel = memo((
        {
            label,
            name
        }:{
            label:ThrmStaffColumns;
            name:string;
        }
    )=>{
        const 
            dispatch = useAppDispatch(),
            sortBy = useAppSelector(state => state.hrmStaff.sortBy,shallowEqual),
            sortOrder = useAppSelector(state => state.hrmStaff.sortOrder,shallowEqual),
            onClick = () => dispatch(reorder(label))
        return (
            <TableSortLabel
                active={sortBy===label}
                direction={sortBy===label ? sortOrder : 'asc'}
                onClick={onClick}
            >
                {name}
            </TableSortLabel>
        )
    })

SortLabel.displayName = 'SortLabel'
Head.displayName = 'Head'
HeaderCell.displayName = 'HeaderCell'
export default Head