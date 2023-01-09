import React, { createContext, Dispatch, memo, useEffect, useReducer, useState } from 'react'
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import DropArea from './drop-area';
import { FileDraft } from '@components/interfaces';
import { Iaction, initialState, reducer, setAllAction } from './reducer';
import Box from '@mui/material/Box';
import FileListItem from './list-item';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody'
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button'

export const FileDispatchContext = createContext<{fileDispatch:Dispatch<Iaction>}>({fileDispatch:()=>{}})

const 
    FileDialog = memo((
        {
            open,
            onClose,
            files,
            updateFiles,
        }:{
            open:boolean;
            onClose:()=>void;
            files:FileDraft[];
            updateFiles:(e:FileDraft[])=>void;
        }
    )=>{
        const 
            [fileState,fileDispatch] = useReducer(reducer,initialState),
            [isLandscape,setIsLandscape] = useState(true),
            updateOrientation = () => setIsLandscape(window.innerWidth > window.visualViewport.height),
            okOnClick = () => {
                onClose()
                updateFiles(fileState.files)
            }

        useEffect(()=>{
            updateOrientation()
            window.addEventListener('resize',updateOrientation,{passive:true})
            return () => window.removeEventListener('resize',updateOrientation)
        },[])

        useEffect(()=>{
            if (open) fileDispatch(setAllAction(files))
        },[open])

        return (
            <Dialog open={open} onClose={onClose} keepMounted>
                <DialogTitle>Attach Files</DialogTitle>
                <DialogContent>
                    <FileDispatchContext.Provider value={{fileDispatch}}>
                        <Stack
                            direction={isLandscape ? 'row' : 'column'}
                            spacing={2}
                        >
                            <DropArea {...{isLandscape}} />
                            {fileState.files.length !== 0 && <Box
                                sx={{
                                    ...(isLandscape 
                                        ? {width:'calc(35vw - 50px)',maxHeight:'calc(80vh - 100px)',height:'350px'} 
                                        : {height:'calc(40vh - 50px)'}
                                    ),
                                    overflowY:'scroll',
                                    pr:3,
                                    mr:'-24px !important'
                                }}
                            >
                                <Table
                                    sx={{
                                        '.MuiTableCell-root':{
                                            p:0,
                                            '&:first-of-type':{
                                                wordBreak:'break-all',
                                                py:0.5,
                                            },
                                            '&:last-of-type':{
                                                width:0
                                            }
                                        }
                                    }}
                                >
                                    <TableBody>
                                        {fileState.files.map(({id,name,size,url})=>(
                                            <FileListItem key={id} {...{id,name,size,url}} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>}
                        </Stack>
                    </FileDispatchContext.Provider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant='contained' onClick={okOnClick}>OK</Button>
                </DialogActions>
            </Dialog>
        )
    })
FileDialog.displayName = 'FileDialog'
export default FileDialog