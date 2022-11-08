import React, { memo, useCallback, useContext } from "react";
import { editTextFieldAction } from "./reducer";
import { Context } from ".";
import { WYSIWYGcommon } from "@components/common-components";

const
    WYSIWYG = memo((
        {
            value,
            field,
            label,
        }:{
            value:string;
            field:'description';
            label:string
        }
    ) => {
        const 
            {addEditTaskDispatch} = useContext(Context),
            handleUpdate = useCallback((e:string) => addEditTaskDispatch(editTextFieldAction({key:field,value:e})),[])

        return (
            <WYSIWYGcommon {...{
                value,
                handleUpdate,
                placeholder:`${label} ...`,
                height:'300px'
            }} />
        )
    })
WYSIWYG.displayName = 'WYSIWYG'
export default WYSIWYG