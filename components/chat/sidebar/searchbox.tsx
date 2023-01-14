import React, { SyntheticEvent, useRef, useState } from 'react'
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '@mui/material/Avatar';
import { Ioption } from '../interfaces';
import { useFetchSpecificRoomsMutation, useSearchChatroomsMutation } from '../reducers/api';
import { ReduxState, useAppDispatch } from '@reducers';
import { chatRoomAddOne, chatRoomSelector} from '../reducers/slice';
import { useRouter } from 'next/router';
import { useStore } from 'react-redux';

const 
    SearchBox = ()=>{
        const
            dispatch = useAppDispatch(),
            autoCompleteRef = useRef<HTMLDivElement>(),
            [options,setOptions] = useState<Ioption[]>([]),
            [searchChatRooms] = useSearchChatroomsMutation(),
            onInputChange = async(_:SyntheticEvent,v:string) => {
                const elem = autoCompleteRef.current.getElementsByTagName('input')[0]
                if (v !== elem.value) elem.value = ''

                if (v==='') {
                    setOptions([])
                    return
                }

                const data = await searchChatRooms(v).unwrap()
                
                setOptions([...data])
            },
            router = useRouter(),
            store = useStore(),
            [fetchSpecificRooms] = useFetchSpecificRoomsMutation(),
            onChange = async (e:SyntheticEvent,v:Ioption) => {
                e.preventDefault()
                const state = store.getState() as ReduxState
                if (v.rid!=='') {
                    const existingRoomIDs = chatRoomSelector.selectIds(state)
                    if (existingRoomIDs.includes(v.rid)) router.push(`/?page=chat&roomid=${v.rid}`,`/chat/r/${v.rid}`,{shallow:true})
                    else {
                        dispatch(chatRoomAddOne({id:v.rid,name:v.name,avatar:v.avatar,isGroup:v.isGroup,users:[]}))
                        try {
                            const result = await fetchSpecificRooms([v.rid]).unwrap() as boolean
                            if (result) router.push(`/?page=chat&roomid=${v.rid}`,`/chat/r/${v.rid}`,{shallow:true})
                        } catch {}
                    }
                } else if (v.uid !== '') router.push(`/?page=chat&userid=${v.uid}`,`/chat/u/${v.uid}`,{shallow:true})
            },
            onFocus = () => setOptions([])

        return (
            <Autocomplete
                ref={autoCompleteRef}
                renderInput={(params) => (
                    <TextField
                        // inputRef={params.InputProps.ref}
                        {...params}
                    />
                )}
                value ={null}
                options={options}
                onChange={onChange}
                disableClearable
                blurOnSelect
                onInputChange={onInputChange}
                getOptionLabel={(opt:Ioption)=>!!opt ? opt.id : ''}
                filterSelectedOptions
                filterOptions={(x) => x}
                isOptionEqualToValue={(opt,val)=>!!opt && !!val && opt.uid===val.uid && opt.rid===val.rid}
                popupIcon={<SearchIcon color='disabled' />}
                renderOption={(prop,{id,rid,uid,avatar,name})=>(<Option {...{...prop,id,rid,uid,avatar,name}} />)}
                onFocus={onFocus}
                sx={{
                    '.MuiAutocomplete-popupIndicatorOpen':{
                        transform:'none'
                    },
                    '.MuiOutlinedInput-root':{
                        py:'2px',
                        borderRadius:'100px',
                    }
                }}
            />
        )
    },
    Option = (props:React.HTMLAttributes<HTMLLIElement> & Ioption) => (
        <>
        {props.name && <Grid 
            component='li'
            pl={2}
            container
            direction='row'
            {...props}
            wrap='nowrap'
        >
            {props.avatar !== undefined && <Avatar src={props.avatar} sx={{mr:2}} />}
            <Typography sx={{textOverflow:'ellipsis',overflow: 'hidden', whiteSpace: 'nowrap'}}>{props.name}</Typography>
        </Grid>}
        </>
    )

export default SearchBox