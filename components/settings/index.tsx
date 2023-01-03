import React, { ChangeEvent, memo, useCallback, useRef, useState } from "react";
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { useAppSelector } from "@reducers";
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useTheme } from "@mui/material";
import UsernameDialog from "./dialogs/username";
import PasswordDialog from "./dialogs/password";
import { userDetailsSelector } from "@reducers/user-details/slice";
import Badge from '@mui/material/Badge';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import AvatarDialog from "./dialogs/avatar";
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useUpdateMaxChildTaskLvlMutation } from "./reducers/api";
import useNarrowBody from "hooks/theme/narrow-body";

const 
    SettingsPage  = () => {
        const
            [usernameOpen,setUsernameOpen] = useState(false),
            toggleUsername = useCallback((e:boolean)=>setUsernameOpen(e),[]),

            [passwordOpen,setPasswordOpen] = useState(false),
            togglePassword = useCallback((e:boolean)=>setPasswordOpen(e),[]),

            [avatarTempUrl,setAvatarTempUrl] = useState(''),
            avatarInputRef = useRef<HTMLInputElement>(),
            avatarBtnOnClick = useCallback(() => avatarInputRef.current.click(),[]),
            avatarInputOnChange = (e:ChangeEvent<HTMLInputElement>) => {
                setAvatarTempUrl(URL.createObjectURL(e.target.files[0]))
                avatarInputRef.current.value = ''
            },
            avatarDialogOnClose = useCallback(()=>{
                URL.revokeObjectURL(avatarTempUrl)
                setAvatarTempUrl('')
            },[])

        return (
            <>
            <Table>
                <TableBody>
                    <SettingsAvatar avatarBtnOnClick={avatarBtnOnClick} />
                    <UserName onOpen={()=>toggleUsername(true)} />
                    <Password onOpen={()=>togglePassword(true)} />
                    <MaxChildTaskLvl />
                </TableBody>
            </Table>
            <UsernameDialog {...{open:usernameOpen,onClose:()=>toggleUsername(false)}} />
            <PasswordDialog {...{open:passwordOpen,onClose:()=>togglePassword(false)}} />
            <AvatarDialog {...{avatarTempUrl,onClose:avatarDialogOnClose}} />
            <input hidden type='file' accept="image/png, image/jpeg" ref={avatarInputRef} onChange={avatarInputOnChange} />
            </>
        )
    },
    SettingsAvatar = memo(({avatarBtnOnClick}:{avatarBtnOnClick:()=>void})=>{
        const 
            {palette:{mode,grey,background}} = useTheme(),
            avatar = useAppSelector(state => userDetailsSelector.selectById(state,state.misc.uid).avatar)

        return (
            <TableRow>
                <TableCell colSpan={2}>
                    <Stack
                        direction='row'
                        sx={{justifyContent:'center'}}
                        py={3}
                    >
                        <Badge
                            badgeContent={
                                <IconButton 
                                    sx={{
                                        backgroundColor:background.default,
                                        '&:hover':{
                                            backgroundColor:grey[mode==='light' ? 100 : 900],
                                        }
                                    }}
                                    onClick={avatarBtnOnClick}
                                >
                                    <FileUploadRoundedIcon />
                                </IconButton>
                            }
                            anchorOrigin={{
                                horizontal:'right',
                                vertical:'bottom'
                            }}
                            sx={{
                                '.MuiBadge-anchorOriginBottomRight':{
                                    bottom:'16px',
                                    right:'16px'
                                }
                            }}
                        >
                            <Avatar 
                                src={avatar} 
                                sx={{
                                    width:120,
                                    height:120
                                }}
                            />
                        </Badge>
                    </Stack>
                </TableCell>
            </TableRow>
        )
    }),
    UserName = memo(({onOpen}:{onOpen:()=>void}) => {
        const
            username = useAppSelector(state => state.misc.username),
            narrowBody = useNarrowBody(),
            {breakpoints:{up},palette:{mode,grey}} = useTheme()
            // matchesSM = useMediaQuery(up('sm')),
            // matchesMD = useMediaQuery(up('md')),
            // sidebarOpen = useAppSelector(state => state.misc.sidebarOpen)

        return (
            <TableRow>
                <TableCell>
                    <Typography fontWeight='bold'>Username</Typography>
                    {narrowBody && <Typography variant='body2' color={grey[mode==='light' ? 600 : 400]}>{username}</Typography>}
                </TableCell>
                <TableCell>
                    <Stack direction='row-reverse'>
                        <IconButton sx={{ml:1}} onClick={onOpen}>
                            <EditRoundedIcon />
                        </IconButton>
                        {!narrowBody && <Typography sx={{alignSelf:'center'}}>{username}</Typography>}
                    </Stack>
                </TableCell>
            </TableRow>
        )
    }),
    Password = memo(({onOpen}:{onOpen:()=>void})=>{
        return (
            <TableRow>
                <TableCell>
                    <Typography fontWeight='bold'>Password</Typography>
                </TableCell>
                <TableCell>
                    <Stack direction='row-reverse'>
                        <IconButton sx={{ml:1}} onClick={onOpen}>
                            <EditRoundedIcon />
                        </IconButton>
                    </Stack>
                </TableCell>
            </TableRow>
        )
    }),
    MaxChildTaskLvl = memo(()=>{
        const 
            maxChildTaskLvl = useAppSelector(state => state.misc.maxChildTaskLvl),
            narrowBody = useNarrowBody(),
            [updateMaxChildTaskLvl] = useUpdateMaxChildTaskLvlMutation(),
            selectOnChange = (e:SelectChangeEvent) => updateMaxChildTaskLvl({maxChildTaskLvl:+e.target.value,fromWS:false}),
            plusOnClick = () => {
                if (maxChildTaskLvl < 5) updateMaxChildTaskLvl({maxChildTaskLvl:maxChildTaskLvl + 1,fromWS:false})
            },
            minusOnClick = () => {
                if (maxChildTaskLvl > 1) updateMaxChildTaskLvl({maxChildTaskLvl:maxChildTaskLvl - 1,fromWS:false})
            }
            
        return (
            <TableRow>
                <TableCell>
                    <Typography fontWeight='bold'>Max Child Task Level</Typography>
                </TableCell>
                <TableCell>
                    <Stack direction='row-reverse'>
                        {narrowBody ? <FormControl size='small'>
                            <Select
                                value={maxChildTaskLvl.toString()}
                                onChange={selectOnChange}
                            >
                                {Array.from(Array(5)).map((_,i)=>(
                                    <MenuItem value={i+1} key={i}>{i+1}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        :
                        <>
                            <IconButton onClick={plusOnClick}>
                                <AddRoundedIcon />
                            </IconButton>
                            <Typography sx={{verticalAlign:'center',lineHeight:'40px',px:1}}>{maxChildTaskLvl}</Typography>
                            <IconButton onClick={minusOnClick}>
                                <RemoveRoundedIcon />
                            </IconButton>
                        </> }
                    </Stack>
                    
                </TableCell>
            </TableRow>
        )
    })
SettingsAvatar.displayName = 'SettingsAvatar'
UserName.displayName = 'UserName'
Password.displayName = 'Password'
MaxChildTaskLvl.displayName = 'MaxChildTaskLvl'
export default SettingsPage