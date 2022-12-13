import React, { ChangeEvent, memo, useContext } from "react";
import TextField from '@mui/material/TextField';
import { editTextFieldAction } from "./reducer";
import { Context } from ".";

const TextInput = memo((
    {
        label,
        field,
        maxLength,
        value,
        required=false,
    }:{
        label:string;
        field:string;
        maxLength:number;
        value:string;
        required?:boolean;
    }
)=>{
    const 
        {addEditTaskDispatch} = useContext(Context),
        onChange = (e:ChangeEvent<HTMLInputElement>) => addEditTaskDispatch(editTextFieldAction({
            key:field,
            value:e.target.value
        }))
    
    return (
        <TextField 
            fullWidth 
            required={required}
            label={label}
            inputProps={{maxLength}}
            value={value}
            onChange={onChange}
        />
    )
})

TextInput.displayName = 'TextInput'
export default TextInput