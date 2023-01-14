import React, { ChangeEvent, createContext, FormEvent, memo, useContext, useReducer, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import { addNewGroupUser, closeError, deleteNewGroupUser, Iactions, initialState, newGroupMoveToStep, popError, reducer, resetNewGroup } from '../reducers/new-group';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useCreateChatGroupMutation } from '../reducers/api';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import AddAPhotoOutlinedIcon from '@mui/icons-material/AddAPhotoOutlined';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import constants from '../../constants'
import { updateLoading } from '@reducers/misc';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { ToggleMenuDialogContext } from '..';
import { toggleDialogAction } from '../reducers/toggle-context-menu-dialog';
import { useSearchUserMutation } from '@reducers/user-details/api';
import { userDetailsSelector } from '@reducers/user-details/slice';
import { AutocompleteUserOption } from '@components/common-components';
import { useRouter } from 'next/router';
import { getImageFromURL } from '@components/functions';
import { useStore } from 'react-redux';

const 
    Context = createContext<{newGroupDispatch: React.Dispatch<Iactions>}>({newGroupDispatch:()=>{}}),
    NewGroupDialog = memo(({open}:{open:boolean})=>{
        const 
            [state,newGroupDispatch] = useReducer(reducer,initialState),
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            onClose = () => {
                toggleMenuDialogDispatch(toggleDialogAction({key:'openNewGroupDialog',open:false}))
                setTimeout(()=>newGroupDispatch(newGroupMoveToStep(0)),200)
            },
            errorOnClose = () => newGroupDispatch(closeError)
        
        return (
            <>
            <Dialog 
                keepMounted
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
                <Context.Provider value={{newGroupDispatch}}>
                    <>
                    <StepZero {...{step:state.step,users:state.users}} />
                    <StepOne {...{step:state.step,users:state.users.map(id=>id)}} />
                    </>
                </Context.Provider>
            </Dialog>
            <Snackbar open={state.popError} >
                <Alert 
                    severity="error" 
                    variant="filled" 
                    onClose={errorOnClose}
                >{state.errorText}</Alert>
            </Snackbar>
            </>
        )
    }),
    StepZero = memo((
        {
            users,
            step
        }:{
            users:string[];
            step:number;
        }
    )=>{
        const 
            {newGroupDispatch} = useContext(Context),
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            theme = useTheme(),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            [options,setOptions] = useState<string[]>([]),
            autoCompleteRef = useRef<HTMLDivElement>(),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:string
            ) => {
                e.preventDefault()
                newGroupDispatch(addNewGroupUser(v))
            },
            store = useStore(),
            [searchUser] = useSearchUserMutation(),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                const elem = autoCompleteRef.current.getElementsByTagName('input')[0]
                if (v !== elem.value) elem.value = ''
                
                if (v==='') {
                    setOptions([])
                    return
                }

                try {
                    const 
                        state = store.getState() as ReduxState,
                        result = await searchUser({query:v,exclude:[...users,state.misc.uid]}).unwrap()

                    setOptions([...result])
                } catch (error) {
                    console.log(error)
                }
            },
            toNextStep = () => newGroupDispatch(newGroupMoveToStep(1)),
            onClose = () => {
                toggleMenuDialogDispatch(toggleDialogAction({key:'openNewGroupDialog',open:false}))
                setTimeout(()=>newGroupDispatch(newGroupMoveToStep(0)),200)
            }

        return (
            <>
            <DialogContent sx={{py:0,display:step===0 ? 'block':'none'}}>
                <Table stickyHeader>
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
                                    renderInput={(params) => (<TextField {...params} label="Add members" /> )}
                                    value={null}
                                    options={options}
                                    onChange={onChange}
                                    disableClearable
                                    onInputChange={onInputChange}
                                    getOptionLabel={(opt:string)=>!!opt ? opt : ''}
                                    filterSelectedOptions
                                    filterOptions={(x) => x}
                                    blurOnSelect
                                    isOptionEqualToValue={(opt,val)=>!!opt && !!val && opt===val}
                                    forcePopupIcon={false}
                                    renderOption={(prop,opt)=>(!!opt ? <AutocompleteUserOption {...{...prop,uid:opt}} /> : <></>)}
                                />
                            </TableCell>
                        </TableRow>
                    </TableHead>
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
                        {users.map(id=>(
                            <StepZeroListItem {...{id}} key={id} />
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions sx={{justifyContent:'space-between',display:step===0 ? 'flex':'none'}}>
                <Button sx={{color:theme.palette.text.secondary}} onClick={onClose}>Close</Button>
                <Button sx={{fontWeight:'bold'}} disabled={users.length === 0} onClick={toNextStep}>Next</Button>
            </DialogActions>
            </>
        )
    }),
    StepZeroListItem = memo(({id}:{id:string})=>{
        const 
            {newGroupDispatch} = useContext(Context),
            onDelete = () => newGroupDispatch(deleteNewGroupUser(id)),
            firstName = useAppSelector(state => userDetailsSelector.selectById(state,id).firstName),
            lastName = useAppSelector(state => userDetailsSelector.selectById(state,id).lastName),
            avatar = useAppSelector(state => userDetailsSelector.selectById(state,id).avatar)

        return (
            <TableRow>
                <TableCell>
                    <Avatar src={avatar} />
                </TableCell>
                <TableCell>
                    <Typography>{`${firstName} ${lastName}`.trim()}</Typography>
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
    }),
    StepOne = memo((
        {
            step,
            users,
        }:{
            step:number;
            users:string[];
        }
    )=>{
        const 
            theme = useTheme(),
            dispatch = useAppDispatch(),
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            {newGroupDispatch} = useContext(Context),
            [imageURL,setImageURL] = useState(''),
            fileInputRef = useRef<HTMLInputElement>(),
            nameRef = useRef<HTMLInputElement>(),
            submitBtnRef = useRef<HTMLInputElement>(),
            cameraOnClick = () => fileInputRef.current.click(),
            imageOnSelect = (e:ChangeEvent<HTMLInputElement>) => {
                if (!!e.target.files && !!e.target.files[0]) {
                    if (imageURL !== '') URL.revokeObjectURL(imageURL)
                    setImageURL(URL.createObjectURL(e.target.files[0]))
                }
            },
            onClose = () => {
                toggleMenuDialogDispatch(toggleDialogAction({key:'openNewGroupDialog',open:false}))
                setTimeout(()=>newGroupDispatch(newGroupMoveToStep(0)),200)
            },
            onStepBack = () => newGroupDispatch(newGroupMoveToStep(0)),
            router = useRouter(),
            [createChatGroup] = useCreateChatGroupMutation(),
            uploadImage = async(e:FormEvent) => {
                e.preventDefault()
                dispatch(updateLoading(true))
                let avatar = ''

                if (!!imageURL){
                    const 
                        img = await getImageFromURL(imageURL),
                        canvas = document.createElement('canvas'),
                        ctx = canvas.getContext('2d'),
                        imgW = img.width,
                        imgH = img.height,
                        canvasSize = Math.min(imgW,imgH,constants.avatarSize * 2)
                        
                    let arg:(HTMLImageElement|number)[] = []
                    if (imgW > imgH) arg = [img,Math.floor((imgW - imgH) * 0.5),0,imgH,imgH]
                    else if (imgW < imgH) arg = [img,0,Math.floor((imgH - imgW) * 0.5),imgW,imgW]
                    else arg = [img,0,0,imgW,imgW]
                    arg = [...arg,0,0,canvasSize,canvasSize]
                    ctx.drawImage.apply(ctx,arg)

                    avatar = canvas.toDataURL(fileInputRef.current.files[0].type,0.7)
                }
                const apiResponse = await createChatGroup({
                    uids:users,
                    avatar,
                    name:nameRef.current.value
                }).unwrap()
                if (!apiResponse) {
                    newGroupDispatch(popError('Connection error. Please try again later.'))
                    dispatch(updateLoading(false))
                } else if (!!apiResponse.success && !!apiResponse.roomID){
                    onClose()
                    router.push(`/?page=chat&roomid=${apiResponse.roomID}`,`/chat/r/${apiResponse.roomID}`,{shallow:true})
                    setTimeout(()=>newGroupDispatch(resetNewGroup),200)
                }
            },
            submitForm = () => submitBtnRef.current.click()

        return (
            <>
            <DialogContent 
                sx={{
                    py:0,
                    display:step===1 ? 'flex':'none'
                }}
            >
                <Grid 
                    container 
                    direction='column' 
                    sx={{justifyContent:'center'}}
                    component='form'
                    onSubmit={uploadImage}
                >
                    <Grid container direction='row' sx={{mb:'5vh'}}>
                        <Grid container direction='row' sx={{justifyContent:'center'}}>
                            <input 
                                type='file' 
                                ref={fileInputRef} 
                                hidden
                                onChange={imageOnSelect} 
                                accept='image/png,image/jpeg'
                            />
                            <Grid
                                item
                                sx={{
                                    width:constants.avatarSize,
                                    height:constants.avatarSize,
                                    position:'relative'
                                }}
                            >
                                <Avatar 
                                    src={imageURL} 
                                    sx={{
                                        width:'100%',
                                        height:'100%',
                                        position:'absolute',
                                        display:!!imageURL ? 'block' :'none'
                                    }}
                                />
                                <IconButton 
                                    sx={{
                                        width:'100%',
                                        height:'100%',
                                        position:'absolute',
                                        backgroundColor:!!imageURL ? 'transparent' : theme.palette.primary[theme.palette.mode],
                                        '.MuiSvgIcon-root':{
                                            width:'3rem',
                                            height:'3rem',
                                            transition:'all 0.1s',
                                            opacity:!!imageURL ? '0' : '1',
                                        },
                                        '&:hover':{
                                            // p:5.5,
                                            backgroundColor:!!imageURL ? 'rgba(0,0,0,0.3)' : theme.palette.primary[theme.palette.mode],
                                            '.MuiSvgIcon-root':{
                                                width:'3.5rem',
                                                height:'3.5rem',
                                                opacity:'1'
                                            }
                                        }
                                    }}
                                    onClick={cameraOnClick}
                                >
                                    {!!imageURL ? <EditRoundedIcon /> : <AddAPhotoOutlinedIcon />}
                                </IconButton>
                            </Grid>
                        </Grid>
                        <Typography 
                            align='center' 
                            sx={{
                                width:'100%',
                                mt:1,
                                fontSize:'0.8rem',
                                fontStyle:'italic',
                                color:theme.palette.text.disabled
                            }}
                        >PNG or JPG file only</Typography>
                    </Grid>
                    <TextField 
                        label='Group Name' 
                        required 
                        inputRef={nameRef}
                        inputProps={{
                            maxLength:100
                        }}
                    />
                    <input type='submit' hidden ref={submitBtnRef} />
                </Grid>
            </DialogContent>
            <DialogActions sx={{justifyContent:'space-between',display:step===1 ? 'flex':'none'}}>
                <Grid>
                    <Button sx={{color:theme.palette.text.secondary}} onClick={onClose}>Close</Button>
                    <Button sx={{color:theme.palette.text.secondary}} onClick={onStepBack}>Back</Button>
                </Grid>
                <Button sx={{fontWeight:'bold'}} onClick={submitForm}>Create Group</Button>
            </DialogActions>
            </>
        )
    })

StepZero.displayName = 'StepZero'
StepZeroListItem.displayName = 'StepZeroListItem'
StepOne.displayName = 'StepOne'
NewGroupDialog.displayName = 'NewGroupDialog'
export default NewGroupDialog