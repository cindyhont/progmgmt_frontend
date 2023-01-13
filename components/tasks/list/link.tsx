import React from "react";
import { useAppSelector } from "@reducers";
import { taskSelector } from "../reducers/slice";
import { EntityId } from "@reduxjs/toolkit";
import TableCell from '@mui/material/TableCell';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

const
    LinkElem = (
        {
            id,
            field,
        }:{
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            value = useAppSelector(state => taskSelector.selectById(state,id)[field])
            // [editMode,setEditMode] = useState(false),
            // penOnClick = () => setEditMode(true),

        return (
            <TableCell
                className={`${field.toString()} task-list-body-cell`}
                data-field={field}
                data-taskid={id}
                sx={{
                    p:0,
                    pl:2
                }}
            >
                {!!value?.text && !!value?.url && <Link 
                    href={value.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    sx={{
                        display:'flex',
                        flexDirection:'column',
                        justifyContent:'center',
                        height:'100%'
                    }}
                >
                    <Typography
                        sx={{
                            fontSize:'0.9rem',
                        }}
                    >{value.text}</Typography>
                </Link>}
                {!value?.text && !!value?.url && <Link 
                    href={value.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    sx={{
                        display:'flex',
                        flexDirection:'column',
                        justifyContent:'center',
                        maxWidth:200,
                        height:'100%'
                    }}
                >
                    <Typography
                        sx={{
                            textOverflow:'ellipsis',
                            overflow: 'hidden', 
                            whiteSpace: 'nowrap',
                            fontSize:'0.9rem',
                        }}
                    >{value.url}</Typography>
                </Link>}
            </TableCell>
        )
    }

export default LinkElem