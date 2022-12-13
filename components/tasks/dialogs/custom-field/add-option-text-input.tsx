import React, { KeyboardEvent, memo, useEffect, useRef } from "react";
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

const AddOptionTextInput = memo((
    {
        addOption,
        colSpan,
    }:{
        addOption:(name:string)=>void;
        colSpan:number;
    }
) => {
    const
        inputRef = useRef<HTMLInputElement>(),
        addOpt = () => {
            addOption(inputRef.current.value.trim())
            inputRef.current.value = ''
            inputRef.current.focus()
        },
        enterPressed = (e:KeyboardEvent) => {
            if (e.key==='Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey && inputRef.current.value.trim() !== ''){
                e.preventDefault()
                addOpt()
            }
        }

    useEffect(()=>{
        inputRef.current.focus()
    },[])

    return (
        <TableRow>
            <TableCell 
                colSpan={colSpan}
                sx={{
                    backgroundColor:'transparent',
                    p:0,
                    border:'none',
                }}
            >
                <TextField 
                    fullWidth
                    inputRef={inputRef}
                    label='Add option...'
                    onKeyDown={enterPressed}
                />
            </TableCell>
            <TableCell
                sx={{
                    backgroundColor:'transparent',
                    p:0,
                    border:'none',
                    width:0
                }}
            >
                <Button 
                    sx={{p:0,width:57,height:57,minWidth:'unset',ml:1}}
                    variant='contained'
                    onClick={addOpt}
                >
                    <AddRoundedIcon fontSize='large' />
                </Button>
            </TableCell>
        </TableRow>
    )
})
AddOptionTextInput.displayName = 'AddOptionTextInput'
export default AddOptionTextInput