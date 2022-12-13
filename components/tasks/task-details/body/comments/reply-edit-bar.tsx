import React, { memo, useContext, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import { createSelector } from '@reduxjs/toolkit'
import { ReduxState, useAppSelector } from '@reducers'
import { taskCommentSelector } from '@components/tasks/reducers/slice'
import { userDetailsSelector } from '@reducers/user-details/slice'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material'
import { useStore } from 'react-redux'
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { DispatchContext, ReplyEditContext } from '.'

const 
    ReplyOrEditBarContent = memo(()=>{
        const
            {commentMode,replyEditID} = useContext(ReplyEditContext),
            [mode,setMode] = useState<"reply" | "edit">(null),
            [firstName,setFirstName] = useState(''),
            [content,setContent] = useState(''),
            store = useStore(),
            updateContent = () => {
                if (!replyEditID) return

                const
                    state = store.getState() as ReduxState,
                    comment = taskCommentSelector.selectById(state,replyEditID)
                if (!comment) return

                if (!comment.content) setContent(comment.content)
                else {
                    const 
                        parser = new DOMParser(),
                        doc = parser.parseFromString(comment.content,'text/html')
                    setContent(doc.body.innerText)
                }

                const 
                    uid = state.misc.uid,
                    {sender} = comment
                if (uid===sender) setFirstName('You')
                else setFirstName(userDetailsSelector.selectById(state,sender)?.firstName || 'Unknown user')
            },
            updateMode = () => {
                if (!!commentMode) setMode(commentMode)
            },
            theme = useTheme(),
            {updateCommentMode} = useContext(DispatchContext),
            closeOnClick = () => updateCommentMode(null)

        useEffect(()=>{
            updateContent()
        },[replyEditID])

        useEffect(()=>{
            updateMode()
        },[commentMode])

        return (
            <Table
                sx={{
                    borderRadius:1000,
                    backgroundColor:theme.palette.background.paper,
                }}
            >
                <TableBody>
                    <TableRow
                        sx={{
                            '.MuiTableCell-root':{
                                border:'none'
                            }
                        }}
                    >
                        <TableCell
                            sx={{
                                width:0,
                                p:1,
                                pl:2,
                            }}
                        >
                            {mode==='edit' ? <EditRoundedIcon color='disabled' /> : <ReplyOutlinedIcon color='disabled' />}
                        </TableCell>
                        <TableCell
                            sx={{
                                display:'grid',
                                my:0.5,
                                py:0.5,
                                px:2,
                                borderRadius:3,
                                cursor:!!mode ? 'pointer' : 'default',
                                pointerEvents: !!mode ? 'auto' : 'none',
                                maxHeight:40,
                                overflow:'hidden',
                                '&:hover':{
                                    backgroundColor:theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900]
                                }
                            }}
                            // onClick={msgOnClick}
                        >
                            <Typography
                                sx={{
                                    fontSize:'0.8rem',
                                    lineHeight:'1rem',
                                    textOverflow:'ellipsis',
                                    overflow: 'hidden', 
                                    whiteSpace: 'nowrap',
                                    color:theme.palette.text.secondary
                                }}
                            >{mode==='edit' ? 'Edit message' : firstName}:</Typography>
                            <Box 
                                dangerouslySetInnerHTML={{__html:content}}
                                sx={{
                                    fontSize:'0.8rem',
                                    lineHeight:'1rem',
                                    textOverflow:'ellipsis',
                                    overflow: 'hidden', 
                                    whiteSpace: 'nowrap',
                                    color:theme.palette.text.secondary,
                                    '& > :first-of-type':{
                                        m:0
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell
                            sx={{
                                width:0,
                                py:0,
                                px:1
                            }}
                        >
                            <IconButton
                                sx={{
                                    '&:hover .MuiSvgIcon-root':{
                                        fill:theme.palette.text.primary
                                    }
                                }}
                                onClick={closeOnClick}
                            >
                                <CloseRoundedIcon 
                                    sx={{
                                        fill:theme.palette.text.secondary
                                    }}
                                />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
    }),
    ReplyOrEditBar = memo(()=>{
        const
            {commentMode,replyEditID} = useContext(ReplyEditContext),
            validIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskCommentSelector.selectIds(state).includes(replyEditID),
                (e:boolean)=>e
            ),[replyEditID]),
            idIsValid = useAppSelector(state => !!replyEditID && validIdSelector(state))

        return (
            <Box
                sx={{
                    opacity:!!commentMode && !!idIsValid ? '1' : '0',
                    height:!!commentMode && !!idIsValid ? '48px' : '0px',
                    ...(!commentMode && {transition:'all 0.2s'}),
                }}
            >
                <ReplyOrEditBarContent />
            </Box>
        )
    })
ReplyOrEditBarContent.displayName = 'ReplyOrEditBarContent'
ReplyOrEditBar.displayName = 'ReplyOrEditBar'
export default ReplyOrEditBar