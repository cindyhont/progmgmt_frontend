import React, { ChangeEvent, createContext, memo, useContext, useReducer, useRef, useState, Dispatch } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { addNewRoom, deleteRoom, Iactions, initialState, reducer, resetForward } from "../reducers/forward";
import { Ioption } from "../interfaces";
import { useAppDispatch } from "@reducers";
import { useForwardConvoMutation, useSearchChatroomsMutation } from "../reducers/api";
import { EntityId } from "@reduxjs/toolkit";
import { ToggleMenuDialogContext } from "..";
import { toggleDialogAction } from "../reducers/toggle-context-menu-dialog";

const
    Context = createContext<{forwardDispatch: Dispatch<Iactions>}>({forwardDispatch:()=>{}}),
    ForwardDialog = ({open}:{open:boolean})=>{
        const
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            theme = useTheme(),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            [state,forwardDispatch] = useReducer(reducer,initialState),
            [forwardConvo] = useForwardConvoMutation(),
            onClose = () => {
                toggleMenuDialogDispatch(toggleDialogAction({key:'openForwardDialog',open:false}))
                setTimeout(()=>forwardDispatch(resetForward),200)
            },
            forwardOnClick = () => forwardConvo(state.rooms)

        return (
            <Dialog 
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth='xs'
                sx={{
                    '.MuiPaper-root':{
                        height:600,
                        maxHeight:'80vh'
                    }
                }}
            >
                <DialogContent sx={{py:0}}>
                    <Table stickyHeader>
                        <Context.Provider value={{forwardDispatch}}>
                            <SearchBox ids={state.rooms.map(({id})=>id)} />
                        </Context.Provider>
                        <TableBody
                            sx={{
                                '.MuiTableCell-body':{
                                    px:0,
                                    py:1,
                                    '&:first-of-type':{
                                        pr:3,
                                        display:matchesSM ? 'table-cell' : 'none',
                                        width:0
                                    }
                                }
                            }}
                        >
                            <Context.Provider value={{forwardDispatch}}>
                                {state.rooms.map((r,i)=>(
                                    <Room key={i} {...r} />
                                ))}
                            </Context.Provider>
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions sx={{justifyContent:'space-between'}}>
                    <Button sx={{color:theme.palette.text.secondary}} onClick={onClose}>Cancel</Button>
                    <Button sx={{fontWeight:'bold'}} disabled={state.rooms.length === 0} onClick={forwardOnClick}>Forward</Button>
                </DialogActions>
            </Dialog>
        )
    },
    SearchBox = memo(({ids}:{ids:EntityId[]}) => {
        const 
            dispatch = useAppDispatch(),
            {forwardDispatch} = useContext(Context),
            theme = useTheme(),
            autoCompleteRef = useRef<HTMLDivElement>(),
            [options,setOptions] = useState<Ioption[]>([]),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:Ioption
            ) => {
                e.preventDefault()
                forwardDispatch(addNewRoom(v))
            },
            [searchChatRooms] = useSearchChatroomsMutation(),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                const elem = autoCompleteRef.current.getElementsByTagName('input')[0]
                if (v !== elem.value) elem.value = ''
                
                if (v==='') {
                    setOptions([])
                    return
                }

                try {
                    const result = await searchChatRooms(v).unwrap()
                    setOptions([...result.filter(({id})=>!ids.includes(id))])
                } catch (error) {
                    console.log(error)
                }
            }

        return (
            <TableHead>
                <TableRow>
                    <TableCell 
                        colSpan={3}
                        sx={{
                            backgroundColor:theme.palette.background.paper,
                            backgroundImage:'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
                            borderBottom:'none',
                            pb:1,
                            pt:2,
                            px:0
                        }}
                    >
                        <Autocomplete
                            ref={autoCompleteRef}
                            renderInput={(params) => (<TextField {...params} label="Forward message to..." />)}
                            value={null}
                            onFocus={()=>setOptions([])}
                            options={options}
                            onChange={onChange}
                            disableClearable
                            onInputChange={onInputChange}
                            getOptionLabel={(opt:Ioption)=>!!opt ? opt.id : ''}
                            filterSelectedOptions
                            blurOnSelect
                            filterOptions={(x) => x}
                            isOptionEqualToValue={(opt,val)=>!!opt && !!val && opt.uid===val.uid}
                            forcePopupIcon={false}
                            renderOption={(prop,{id,rid,uid,avatar,name})=>(<Option {...{...prop,id,rid,uid,avatar,name}} />)}
                        />
                    </TableCell>
                </TableRow>
            </TableHead>
        )
    }),
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
    ),
    Room = memo(({id,name,avatar}:Ioption)=>{
        const 
            {forwardDispatch} = useContext(Context),
            onDelete = () => forwardDispatch(deleteRoom(id))

        return (
            <TableRow>
                <TableCell>
                    <Avatar src={avatar} />
                </TableCell>
                <TableCell>
                    <Typography>{name}</Typography>
                </TableCell>
                <TableCell>
                    <IconButton
                        sx={{
                            float:'right',
                            mr:-1
                        }}
                        onClick={onDelete}
                    >
                        <ClearRoundedIcon color='error' />
                    </IconButton>
                </TableCell>
            </TableRow>
        )
    })

SearchBox.displayName = 'SearchBox'
Room.displayName = 'Room'
export default ForwardDialog