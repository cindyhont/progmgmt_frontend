import { useAppDispatch, useAppSelector } from "@reducers";
import React, { memo, useRef } from "react";
import { shallowEqual } from "react-redux";
import Dialog from '@mui/material/Dialog';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import { staffHeaderArr } from "../functions";
import { v4 as uuidv4 } from 'uuid'
import { updateColumnVisibility } from './reducers/slice'

const 
    ShowHideColumnModal = memo(({showHideColumnModalOn}:{showHideColumnModalOn:boolean}) => {
        const 
            dispatch = useAppDispatch(),
            columnVisibility:number = useAppSelector(state => state.hrmStaff.columnVisibility,shallowEqual),
            initialVisibility = useRef(columnVisibility).current,
            idPrefix = uuidv4(),
            modalOnClose = () => {
                const rowLen = staffHeaderArr.length;
                let newVisibility = 0;

                for (let i=0; i<rowLen; i++){
                    if ((document.getElementById(`${idPrefix}-${i.toString().padStart(2,'0')}`) as HTMLInputElement).checked){
                        newVisibility += Math.pow(2,i)
                    }
                }
                dispatch(updateColumnVisibility(newVisibility))
            }

        return (
            <Dialog
                keepMounted
                open={showHideColumnModalOn}
                onClose={modalOnClose}
            >
                <Table
                    sx={{
                        '.MuiTableCell-root':{
                            p:1,
                            pl:3,
                            fontSize:'1rem'
                        }
                    }}
                >
                    <TableBody>
                        {staffHeaderArr.map(({name},i)=>(
                            <ShowHideStaffRow 
                                {...{
                                    idPrefix,
                                    idx:i,
                                    name,
                                    initialVisibility,
                                }}
                                key={i}
                            />
                        ))}
                    </TableBody>
                </Table>
            </Dialog>
        )
    }),
    ShowHideStaffRow = memo((
        {
            idPrefix,
            idx,
            name,
            initialVisibility,
        }:{
            idPrefix:string;
            idx:number;
            name:string;
            initialVisibility:number;
        }
    )=>(
        <TableRow>
            <TableCell>{name}</TableCell>
            <TableCell>
                <Checkbox 
                    id={`${idPrefix}-${idx.toString().padStart(2,'0')}`}
                    defaultChecked={!!(initialVisibility & Math.pow(2,idx))}
                />
            </TableCell>
        </TableRow>
    ))

ShowHideStaffRow.displayName = 'ShowHideStaffRow'
ShowHideColumnModal.displayName = 'ShowHideColumnModal'
export default ShowHideColumnModal;