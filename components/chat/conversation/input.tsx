import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import { chatRoomFileInputSetAll, chatRoomSelector, chatUserFileInputSetAll, chatUserSelector, updateChatRoomStatus, updateChatUserStatus } from '../reducers/slice';
import { enterIsPressed, fileInputSelector } from '@components/functions';
import { useSendWsMessageMutation } from 'websocket/api';
import { ActionTypes } from '../reducers/ws-message-types';
import { useRouter } from 'next/router';
import { useCreateConvoInExistingRoomMutation, useCreateRoomNoConvoMutation, useCreateRoomWithFirstConvoMutation } from '../reducers/api';
import { useStore } from 'react-redux';
import { FileDraft } from '@components/interfaces';
import FileDialog from '@components/common-components/file-dialog';
import Badge from '@mui/material/Badge';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import { Editor } from '@tinymce/tinymce-react';
import { EditorEvent, Editor as EditorType } from 'tinymce';
import userDetailsApi from '@reducers/user-details/api';
import { userDetailsSelector } from '@reducers/user-details/slice';
import MoodRoundedIcon from '@mui/icons-material/MoodRounded';

const ChatInput = memo((
    {
        editorLoaded,
        editorIsLoaded
    }:{
        editorLoaded:boolean;
        editorIsLoaded:()=>void;
    }
)=>{
    const 
        dispatch = useAppDispatch(),
        router = useRouter(),
        roomID = router.query.roomid as string,
        userID = router.query.userid as string,
        {palette:{mode,grey}} = useTheme(),
        modeRef = useRef<'light'|'dark'>(),
        editorRef = useRef<HTMLDivElement>(),
        [noInputString,setNoInputString] = useState(true),
        noFileInputSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>{
                const fileInput = !!roomID
                    ? chatRoomSelector.selectById(state,roomID).fileInputs
                    : chatUserSelector.selectById(state,userID).fileInputs;
                return fileInputSelector.selectTotal(fileInput)===0
            }
        ),[roomID,userID]),
        noFileInput = useAppSelector(state => noFileInputSelector(state)),
        typingTimeoutRef = useRef<NodeJS.Timeout>(),
        [typing,setTyping] = useState(false),
        timestamp = useRef(0),
        [createConvoInRoom] = useCreateConvoInExistingRoomMutation(),
        [createRoomWithFirstConvo] = useCreateRoomWithFirstConvoMutation(),
        [createRoomNoConvo] = useCreateRoomNoConvoMutation(),
        fileBtnOnClick = () => setFileDialogOpen(true),
        [sendWsMessage] = useSendWsMessageMutation(),
        store = useStore(),
        [fileDialogOpen,setFileDialogOpen] = useState(false),
        fileDialogOnClose = useCallback(()=>setFileDialogOpen(false),[]),
        filesSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>{
                if (!userID && !roomID) return []
                if (!!roomID) {
                    const r = chatRoomSelector.selectById(state,roomID)
                    return !!r ? fileInputSelector.selectAll(r.fileInputs) : []
                } else {
                    const u = chatUserSelector.selectById(state,userID)
                    return !!u ? fileInputSelector.selectAll(u.fileInputs) : []
                }
            }
        ),[roomID,userID]),
        files = useAppSelector(state => filesSelector(state)),
        updateFiles = useCallback((e:FileDraft[])=>{
            if (!!roomID) dispatch(chatRoomFileInputSetAll({files:e,roomID}))
            else if (!!userID) dispatch(chatUserFileInputSetAll({files:e,userID}))
        },[roomID,userID]),
        onChange = () => {
            setNoInputString(editorRef.current.innerText.trim()==='')
            clearTimeout(typingTimeoutRef.current)

            const draft = editorRef.current.innerHTML

            if (!!roomID){
                dispatch(updateChatRoomStatus({id:roomID,changes:{draft}}))
                setTyping(true)
                typingTimeoutRef.current = setTimeout(()=>setTyping(false),1000)
            } else dispatch(updateChatUserStatus({id:userID,changes:{draft}}))
        },
        submitConvo = async(msg:string) => {
            setNoInputString(true)
            editorRef.current.innerHTML = ''
            if (!!roomID) {
                createConvoInRoom({msg,roomID})
            } else if (!!userID){
                if (noFileInput) {
                    try {
                        const result = await createRoomWithFirstConvo({msg,userID}).unwrap()
                        if (!!result) router.push(`/?page=chat&roomid=${result}`,`/chat/r/${result}`,{shallow:true})
                    } catch {}
                } else {
                    try {
                        const result = await createRoomNoConvo({msg,userID}).unwrap()
                        if (!!result) router.push(`/?page=chat&roomid=${result}`,`/chat/r/${result}`,{shallow:true})
                    } catch {}
                }
            }
        },
        submitOnClick = () => submitConvo(editorRef.current.innerHTML),
        onKeyDown = (e:KeyboardEvent) => {
            if (e.timeStamp === timestamp.current) return
            timestamp.current = e.timeStamp
            if (enterIsPressed(e)) {
                const 
                    state = store.getState() as ReduxState,
                    entity = !!roomID ? chatRoomSelector.selectById(state,roomID) : chatUserSelector.selectById(state,userID),
                    draft = entity.draft,
                    files = entity.fileInputs,
                    parser = new DOMParser(),
                    doc = parser.parseFromString(draft,'text/html')

                if (!!fileInputSelector.selectTotal(files) || doc.body.innerText.trim() !== '') submitConvo(doc.body.innerHTML)
            }
        },
        onKeyUp = (e:KeyboardEvent) => {
            if (e.timeStamp === timestamp.current) return
            timestamp.current = e.timeStamp
            if (!enterIsPressed(e)) onChange()
        },
        onClipboardEvent = (e:ClipboardEvent) => {
            if (e.timeStamp === timestamp.current) return
            timestamp.current = e.timeStamp
            onChange()
        },
        showInlineToolbarClassName = useRef('show-inline-editor-toolbar').current,
        editorID = useRef('chat-input').current,
        roomIdRef = useRef<EntityId>(),
        userIdRef = useRef<EntityId>(),
        editorCommandOnExec = (e:EditorEvent<any>) => {
            if (e.command !== 'mceFocus' && !e?.value?.dialog) {
                setNoInputString(editorRef.current.innerText.trim()==='')
                if (!!roomIdRef.current) dispatch(updateChatRoomStatus({id:roomIdRef.current,changes:{draft:editorRef.current.innerHTML}}))
                else if (!!userIdRef.current) dispatch(updateChatUserStatus({id:userIdRef.current,changes:{draft:editorRef.current.innerHTML}}))
            }
        },
        emoticonSelector = useRef('.tox-tinymce-inline .tox-toolbar__group:first-child > button').current,
        editorIsActive = useRef(false),
        editorOnFocus = () => editorIsActive.current = true,
        emoticonOnClick = () => {
            if (!editorIsActive.current) editorRef.current.focus()
            const btn = document.querySelector(emoticonSelector) as HTMLButtonElement
            if (!!btn) btn.click()
        }

    useEffect(()=>{
        modeRef.current = mode
    },[mode])

    useEffect(()=>{
        if (!!roomID) sendWsMessage({
            req:ActionTypes.typing,
            roomid:roomID,
            typing
        })
    },[typing])

    useEffect(()=>{
        roomIdRef.current = roomID
        userIdRef.current = userID

        if (editorIsLoaded) {
            if (!editorRef.current) editorRef.current = document.getElementById(editorID) as HTMLDivElement
            editorRef.current.addEventListener('keydown',onKeyDown)
            editorRef.current.addEventListener('keyup',onKeyUp)
            editorRef.current.addEventListener('cut',onClipboardEvent)
            editorRef.current.addEventListener('paste',onClipboardEvent)
        }
        return () => {
            if (!!editorRef.current){
                editorRef.current.removeEventListener('keydown',onKeyDown)
                editorRef.current.removeEventListener('keyup',onKeyUp)
                editorRef.current.removeEventListener('cut',onClipboardEvent)
                editorRef.current.removeEventListener('paste',onClipboardEvent)
            }
            clearTimeout(typingTimeoutRef.current)
            if (!!roomID) sendWsMessage({
                req:ActionTypes.typing,
                roomid:roomID,
                typing:false
            })
            setTyping(false)

            document.body.classList.remove(showInlineToolbarClassName)
        }
    },[editorLoaded,userID,roomID])
    
    return (
        <>
        <Box
            sx={{
                borderRadius:5,
                border:`1px solid ${grey[500]}`,
                ml:'1px'
            }}
        >
            <Table
                sx={{
                    '.MuiTableCell-root':{
                        p:0,
                        border:'none',
                        fontSize:'1rem',
                        '&:not(:nth-of-type(2))':{width:34,position:'relative'}
                    }
                }}
            >
                <TableBody>
                    <TableRow>
                        <TableCell>
                            <IconButton 
                                size='small' 
                                onClick={emoticonOnClick}
                                sx={{
                                    position:'absolute',
                                    bottom:'0px',
                                }}
                            >
                                <MoodRoundedIcon />
                            </IconButton>
                        </TableCell>
                        <TableCell>
                            <Editor
                                tinymceScriptSrc="tinymce/tinymce.min.js"
                                inline
                                id={editorID}
                                onInit={editorIsLoaded}
                                onFocus={editorOnFocus}
                                init={{
                                    menubar:false,
                                    plugins:`quickbars emoticons autolink link mention`,
                                    toolbar:'emoticons',
                                    quickbars_selection_toolbar:`bold italic underline strikethrough | link`,
                                    quickbars_insert_toolbar:false,
                                    contextmenu:'link',
                                    link_default_target:'_blank',
                                    setup:(editor)=>{
                                        editor.on('ExecCommand',editorCommandOnExec)

                                        window.tinymce.PluginManager.add('mention',(editor:EditorType)=>{
                                            editor.ui.registry.addAutocompleter('mentionAutoComplete',{
                                                ch:'@',
                                                minChars:2,
                                                columns:1,
                                                highlightOn: ['char_name'],
                                                fetch:(pattern:string)=>new Promise((resolve)=>{
                                                    dispatch(userDetailsApi.endpoints.searchUser.initiate({query:pattern,exclude:[]})).unwrap()
                                                        .then(res=>{
                                                            const state = store.getState() as ReduxState
                                                            let result:any[] = []
                                                            
                                                            res.forEach(uid=>{
                                                                const 
                                                                    {firstName,lastName,avatar} = userDetailsSelector.selectById(state,uid),
                                                                    fullName = `${firstName} ${lastName}`.trim()
                
                                                                result.push({
                                                                    type: 'cardmenuitem',
                                                                    value: `${uid}_${fullName}`,
                                                                    label: fullName,
                                                                    items:[
                                                                        {
                                                                            type: 'cardcontainer',
                                                                            direction: 'horizontal',
                                                                            items:[
                                                                                {
                                                                                    type: 'cardimage',
                                                                                    src: !!avatar ? avatar : `/user-${modeRef.current}.svg`,
                                                                                    alt: fullName,
                                                                                    classes: ['tinymce-mention-avatar']
                                                                                },
                                                                                {
                                                                                    type: 'cardtext',
                                                                                    text: fullName,
                                                                                    name: 'char_name'
                                                                                }
                                                                            ]
                                                                        }
                                                                    ]
                                                                })
                                                            })
                                                            resolve(result)
                                                        })
                                                }),
                                                onAction(autocompleterApi, rng, value){
                                                    const
                                                        parts = value.split(/_(.*)/s),
                                                        uid = parts[0],
                                                        fullName = parts[1],
                                                        elem = ` <span class="highlight" data-userid="${uid}">@${fullName}</span> `
                
                                                    editor.selection.setRng(rng);
                                                    editor.insertContent(elem);
                
                                                    autocompleterApi.hide();
                                                },
                                            })
                                        })
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell>
                            <IconButton 
                                size='small' 
                                onClick={fileBtnOnClick}
                                sx={{
                                    position:'absolute',
                                    bottom:'0px',
                                }}
                            >
                                <Badge 
                                    badgeContent={files.length} 
                                    max={9} 
                                    color='primary'
                                    anchorOrigin={{horizontal:'left',vertical:'top'}}
                                >
                                    <AttachFileIcon />
                                </Badge>
                            </IconButton>
                        </TableCell>
                        <TableCell>
                            <IconButton 
                                size='small' 
                                id='chat-submit-btn'
                                sx={{
                                    transform:'translateY(-2px) rotate(-30deg)',
                                    position:'absolute',
                                    bottom:'0px',
                                }}
                                color='primary'
                                disabled={noInputString && noFileInput}
                                onClick={submitOnClick}
                            >
                                <SendIcon />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
        <FileDialog {...{
            open:fileDialogOpen,
            onClose:fileDialogOnClose,
            files,
            updateFiles
        }} />
        </>
    )
})

ChatInput.displayName = 'ChatInput'
export default ChatInput