import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { Editor } from '@tinymce/tinymce-react';
import { EditorEvent, Editor as EditorType } from 'tinymce';
import userDetailsApi from '@reducers/user-details/api';
import { userDetailsSelector } from '@reducers/user-details/slice';
import { chatRoomSelector, chatUserSelector, updateChatRoomStatus, updateChatUserStatus } from '@components/chat/reducers/slice';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import { useStore } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { enterIsPressed, fileInputSelector } from '@components/functions';
import { useSendWsMessageMutation } from 'websocket/api';
import { ActionTypes } from '../../reducers/ws-message-types';
import { useCreateConvoInExistingRoomMutation, useCreateRoomNoConvoMutation, useCreateRoomWithFirstConvoMutation } from '@components/chat/reducers/api';
import scrollToBottom from '../functions/to-bottom';
import { ChatEventDispatchContext, ChatEventStateContext, updateEditorLoadStatus } from '../functions/reducer-context';

const WYSIWHYeditor = memo((
    {
        setNoInputString,
    }:{
        setNoInputString:(v:boolean)=>void;
    }
) => {
    const
        {palette:{mode}} = useTheme(),
        router = useRouter(),
        roomID = router.query.roomid as string,
        userID = router.query.userid as string,
        editorID = useRef('chat-input').current,
        editorIsActive = useRef(false),
        editorOnFocus = () => editorIsActive.current = true,
        editorRef = useRef<HTMLDivElement>(),
        roomIdRef = useRef<EntityId>(),
        userIdRef = useRef<EntityId>(),
        dispatch = useAppDispatch(),
        [typing,setTyping] = useState(false),
        timestamp = useRef(0),
        {editorLoaded} = useContext(ChatEventStateContext),
        chatContentEventDispatch = useContext(ChatEventDispatchContext),
        editorOnLoad = () => chatContentEventDispatch(updateEditorLoadStatus()),
        [sendWsMessage] = useSendWsMessageMutation(),
        editorCommandOnExec = (e:EditorEvent<any>) => {
            if (e.command !== 'mceFocus' && !e?.value?.dialog) {
                setNoInputString(editorRef.current.innerText.trim()==='')
                if (!!roomIdRef.current) dispatch(updateChatRoomStatus({id:roomIdRef.current,changes:{draft:editorRef.current.innerHTML}}))
                else if (!!userIdRef.current) dispatch(updateChatUserStatus({id:userIdRef.current,changes:{draft:editorRef.current.innerHTML}}))
            }
        },
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
        modeRef = useRef<'light'|'dark'>(),
        store = useStore(),
        typingTimeoutRef = useRef<NodeJS.Timeout>(),
        showInlineToolbarClassName = useRef('show-inline-editor-toolbar').current,
        [createConvoInRoom] = useCreateConvoInExistingRoomMutation(),
        [createRoomWithFirstConvo] = useCreateRoomWithFirstConvoMutation(),
        [createRoomNoConvo] = useCreateRoomNoConvoMutation(),
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
            setTimeout(()=>scrollToBottom(),10)
        },
        submitOnClick = () => submitConvo(editorRef.current.innerHTML),
        emoticonOnClick = () => {
            if (!editorIsActive.current) editorRef.current.focus()
            const btn = document.querySelector('.tox-tinymce-inline .tox-toolbar__group:first-child > button') as HTMLButtonElement
            if (!!btn) btn.click()
        },
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

        const
            emojiBtn = document.getElementById('chat-emoji-btn'),
            submitBtn = document.getElementById('chat-submit-btn')

        if (editorLoaded) {
            if (!editorRef.current) editorRef.current = document.getElementById(editorID) as HTMLDivElement
            editorRef.current.addEventListener('keydown',onKeyDown,{passive:true})
            editorRef.current.addEventListener('keyup',onKeyUp,{passive:true})
            editorRef.current.addEventListener('cut',onClipboardEvent,{passive:true})
            editorRef.current.addEventListener('paste',onClipboardEvent,{passive:true})

            emojiBtn.addEventListener('click',emoticonOnClick,{passive:true})
            submitBtn.addEventListener('click',submitOnClick,{passive:true})
        }
        return () => {
            if (!!editorRef.current){
                editorRef.current.removeEventListener('keydown',onKeyDown)
                editorRef.current.removeEventListener('keyup',onKeyUp)
                editorRef.current.removeEventListener('cut',onClipboardEvent)
                editorRef.current.removeEventListener('paste',onClipboardEvent)

                emojiBtn.removeEventListener('click',emoticonOnClick)
                submitBtn.removeEventListener('click',submitOnClick)
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
        <Editor
            tinymceScriptSrc={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/tinymce/tinymce.min.js`}
            inline
            id={editorID}
            onInit={editorOnLoad}
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
                                                                src: !!avatar ? avatar : `${process.env.NEXT_PUBLIC_CDN_URL || ''}/user-${modeRef.current}.svg`,
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
    )
})
WYSIWHYeditor.displayName = 'WYSIWHYeditor'
export default WYSIWHYeditor