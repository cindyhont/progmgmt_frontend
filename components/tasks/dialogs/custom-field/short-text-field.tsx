import React, { ChangeEvent, useEffect, useRef } from 'react'
import TextField from '@mui/material/TextField';

const ShortTextField = (
    {
        value,
        onChange
    }:{
        value:string;
        onChange:(v:string)=>void
    }
) => {
    const 
        handleChange = (e:ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
        ref = useRef<HTMLInputElement>()

    useEffect(()=>{
        ref.current.focus()
    },[])

    return (
        <TextField 
            inputRef={ref}
            fullWidth
            label='Default Value'
            inputProps={{maxLength:200}}
            value={value}
            onChange={handleChange}
        />
    )
}

export default ShortTextField