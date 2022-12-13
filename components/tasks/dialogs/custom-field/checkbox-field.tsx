import React, { useEffect, useRef } from "react";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

const CheckboxField = (
    {
        checked,
        onChange
    }:{
        checked:boolean;
        onChange:(v:boolean)=>void;
    }
) => {
    const 
        handleClick = () => onChange(!checked),
        ref = useRef<HTMLInputElement>()

    useEffect(()=>{
        ref.current.focus()
    },[])

    return (
        <FormControlLabel
            control={<Checkbox checked={checked} onClick={handleClick} inputRef={ref} />}
            label="Default checked"
            labelPlacement="end"
        />
    )
}

export default CheckboxField