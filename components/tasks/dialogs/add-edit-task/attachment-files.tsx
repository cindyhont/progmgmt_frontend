import React, { ChangeEvent, memo, useContext, useRef, DragEvent } from "react";
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack';
import { deleteFileAction, editFilesAction } from "./reducer";
import { EntityId } from "@reduxjs/toolkit";

import { v4 as uuidv4 } from 'uuid'
import { FileDraft } from "@components/interfaces";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Context } from ".";

const
    Files = memo(({files}:{files:FileDraft[]}) => {
        const 
            dropAreaRef = useRef<HTMLDivElement>(),
            fileInputRef = useRef<HTMLInputElement>(),
            {addEditTaskDispatch} = useContext(Context),
            addFiles = (filesToAdd:File[]) => addEditTaskDispatch(editFilesAction({key:'files',value:[
                ...files,
                ...filesToAdd.map(f=>({
                    id:uuidv4(),
                    name:f.name,
                    size:f.size,
                    url:URL.createObjectURL(f),
                    folder:'private' as 'private',
                    mimeType:!!f.type ? f.type : '*/*',
                }))
            ]})),
            handleDrop = (e:DragEvent<HTMLDivElement>) => {
                e.preventDefault()
                e.stopPropagation()
                if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return
                addFiles(Array.from(e.dataTransfer.files))
            },
            handleDrag = (e:DragEvent<HTMLDivElement>) => {
                e.preventDefault()
                e.stopPropagation()
            },
            btnOnClick = () => fileInputRef.current.click(),
            fileInputOnChange = (e:ChangeEvent<HTMLInputElement>) => {
                e.preventDefault()
                e.stopPropagation()
                if (!e.target.files || e.target.files.length===0) return
                addFiles(Array.from(e.target.files))
            }

        return (
            <Stack spacing={2} mt={1}>
                <Paper 
                    ref={dropAreaRef}
                    variant='outlined'
                    sx={{
                        minHeight:300,
                        backgroundColor:'transparent',
                        ...(files.length===0 && {
                            display:'flex',
                            flexDirection:'column',
                            justifyContent:'center',
                        })
                    }}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {files.length === 0 && <Typography 
                        align="center" 
                        sx={{
                            textTransform:'uppercase',
                            fontSize:'0.9rem',
                            letterSpacing:'0.05rem',
                            pointerEvents:'none',
                            userSelect:'none'
                        }}
                    >Click here<br/>or Drag files to here</Typography>}
                    {files.length !== 0 && <Table>
                        <TableBody>
                            {files.map(({name,id,url})=>(
                                <FileItems {...{name,id,url}} key={id} />
                            ))}
                        </TableBody>    
                    </Table>}
                </Paper>
                <Button fullWidth variant="contained" onClick={btnOnClick}>Attach Files</Button>
                <input type='file' multiple accept='*/*' hidden ref={fileInputRef} onChange={fileInputOnChange} />
            </Stack>
        )
    }),
    FileItems = memo((
        {
            name,
            id,
            url
        }:{
            name:string;
            id:EntityId;
            url:string;
        }
    )=>{
        const
            {addEditTaskDispatch} = useContext(Context),
            onClick = () => {
                URL.revokeObjectURL(url)
                addEditTaskDispatch(deleteFileAction(id))
            }
        return (
            <TableRow>
                <TableCell>{name}</TableCell>
                <TableCell sx={{width:0,p:0}}>
                    <IconButton onClick={onClick}>
                        <CloseRoundedIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
        )
    })

Files.displayName = 'Files'
FileItems.displayName = 'FileItems'
export default Files