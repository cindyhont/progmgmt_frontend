import React, { ChangeEvent, memo, useCallback, useState } from "react"
import { ReduxState, useAppDispatch } from "@reducers"
import { userDetailsSelector } from "@reducers/user-details/slice"
import { useTheme } from "@mui/material"
import Box from '@mui/material/Box';
import { Editor } from '@tinymce/tinymce-react';
import {Editor as EditorType} from 'tinymce'
import userDetailsApi from "@reducers/user-details/api"
import { useStore } from "react-redux"
import Spinner from './spinner'

const
    file_picker_callback = (cb:Function) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.addEventListener('change', (e:any) => {
            const file = (e as ChangeEvent<HTMLInputElement>).target.files[0];
            cb(URL.createObjectURL(file))
        },{passive:true});

        input.click();
    },
    WYSIWYGnoMode = (
        {
            handleUpdate,
            value,
            placeholder,
            contentStyle,
            height,
            fileBtnOnClick,
            onInit,
        }:{
            handleUpdate:(e:string)=>void;
            value:string;
            placeholder?:string;
            contentStyle:string;
            height?:string;
            fileBtnOnClick?:()=>void;
            onInit:()=>void;
        }
    ) => {
        const 
            dispatch = useAppDispatch(),
            store = useStore(),
            {palette:{mode,primary}} = useTheme()

        return (
            <Editor 
                tinymceScriptSrc={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/tinymce/tinymce.min.js`}
                onEditorChange={handleUpdate}
                value={value}
                onInit={onInit}
                init={{
                    content_css:false,
                    content_style:contentStyle,
                    statusbar: false,
                    menubar:false,
                    plugins:`autolink lists table link image code emoticons mention ${!!fileBtnOnClick ? 'attachment' : ''}`,
                    toolbar:`${!!fileBtnOnClick ? 'attachfile' : ''} emoticons | bold italic underline strikethrough | bullist numlist table | link image | code`,
                    contextmenu:'autolink lists table link image code emoticons',
                    file_picker_types:'image',
                    file_picker_callback,
                    placeholder,
                    height,
                    toolbar_mode: 'floating',
                    width:'100%',
                    extended_valid_elements:'span[data-userid|class]',
                    link_default_target:'_blank',
                    setup:()=>{
                        window.tinymce.PluginManager.add('attachment',(editor:EditorType)=>{
                            editor.ui.registry.addIcon(
                                'new-file', 
                                `
                                    <svg width="24" height="24">
                                        <path d="M14.4 3H7a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V7.6L14.4 3ZM17 19H7V5h6v4h4v10Z" fill-rule="nonzero"/>
                                        <circle class="tinymce-attachment-icon-mark" cx="19" cy="19" r="5" fill="${primary.main}" />
                                    </svg>
                                ` );
                            editor.ui.registry.addButton('attachfile', {
                                icon:'new-file',
                                onAction:()=>{
                                    fileBtnOnClick()
                                },
                            })
                        })

                        window.tinymce.PluginManager.add('mention',(editor:EditorType)=>{
                            editor.ui.registry.addAutocompleter('mentionAutoComplete',{
                                ch:'@',
                                minChars:2,
                                columns:1,
                                highlightOn: ['char_name'],
                                fetch:(pattern:string)=>new Promise(resolve=>{
                                    dispatch(userDetailsApi.endpoints.searchUser.initiate({query:pattern,exclude:[]})).unwrap()
                                        .then(data=>{
                                            const state = store.getState() as ReduxState
                                            let result:any[] = []
                                            data.forEach(uid=>{
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
                                                                    src: !!avatar ? avatar : `${process.env.NEXT_PUBLIC_CDN_URL || ''}/user-${mode}.svg`,
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
    },
    WYSIWYGwrapper = memo((
        {
            children,
            showFileIconMark,
            fileBtnOnClick,
            height,
            loaded
        }:{
            children:JSX.Element;
            showFileIconMark:boolean;
            fileBtnOnClick?:()=>void;
            height?:string;
            loaded:boolean;
        }
    )=>{
        const {palette:{mode,primary}} = useTheme()
        return (
            <Box
                sx={{
                    display:loaded ? 'block' : 'none',
                    '.tox-tinymce':{
                        border:`1px solid ${mode==='dark' ? '#777' : '#bbb'}`,
                        borderRadius:'4px',
                    },
                    '.tox:not(.tox-tinymce-inline) .tox-editor-header,.tox .tox-toolbar-overlord,.tox .tox-toolbar__primary, .tox .tox-edit-area__iframe':{
                        backgroundColor:'transparent',
                    },
                    '.tox .tox-icon svg,.tox .tox-tbtn__select-chevron svg':{
                        fill:mode==='dark' ? 'white' : 'rgba(0,0,0,0.7)'
                    },
                    '.tox .tox-tbtn:hover':{
                        backgroundColor:primary[mode],
                        '& svg':{
                            fill:mode==='dark' ? 'white' : 'rgba(0,0,0,0.7)'
                        }
                    },
                    '.tinymce-attachment-icon-mark':{
                        display:showFileIconMark && !!fileBtnOnClick ? 'inline' : 'none'
                    },
                    ...(mode==='dark' && {
                        '.tox .tox-tbtn--enabled svg':{
                            fill:'black'
                        }
                    }),
                    ...(!!height && {height}),
                }}
            >
                {children}
            </Box>
        )
    }),
    WYSIWYGcommon = memo((
        {
            value,
            handleUpdate,
            placeholder,
            height,
            showFileIconMark,
            fileBtnOnClick,
        }:{
            value:string;
            handleUpdate:(e:string)=>void;
            placeholder?:string;
            height:string;
            showFileIconMark?:boolean;
            fileBtnOnClick?:()=>void;
        }
    )=>{
        const 
            {palette:{mode,primary}} = useTheme(),
            highlightStyle = `
                .highlight {
                    font-weight: bold;
                    color:${primary.main};
                }
            `,
            [loaded,setLoaded] = useState(false),
            onInit = useCallback(()=>setLoaded(true),[])

        return (
            <>
            <Spinner {...{show:!loaded,height}} />
            <WYSIWYGwrapper {...{showFileIconMark,fileBtnOnClick,height,loaded}}>
                <>
                {mode==='dark' &&  <WYSIWYGnoMode {...{
                    handleUpdate,
                    value,
                    placeholder,
                    height,
                    contentStyle:`
                        body {
                            color:white;
                        } 
                        .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{
                            color:rgba(255,255,255,0.5);
                        }
                        ${highlightStyle}
                    `,
                    fileBtnOnClick,
                    onInit,
                }} />}
                {mode==='light' &&  <WYSIWYGnoMode {...{
                    handleUpdate,
                    value,
                    placeholder,
                    height,
                    contentStyle:`
                        body {
                            color:black;
                        }
                        ${highlightStyle}
                    `,
                    fileBtnOnClick,
                    onInit,
                }} />}
                </>
            </WYSIWYGwrapper>
            </>
        )
    })
WYSIWYGwrapper.displayName = 'WYSIWYGwrapper'
WYSIWYGcommon.displayName = 'WYSIWYGcommon'
export {
    WYSIWYGcommon,
    WYSIWYGwrapper,
}