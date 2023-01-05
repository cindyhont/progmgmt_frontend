import React, { memo, SyntheticEvent, useContext } from "react";
import { useTheme } from '@mui/material/styles';
import {blue} from '@mui/material/colors';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { toggleAccordionAction } from "./reducer";
import { Context } from ".";

const
    AddEditTaskAccordion = memo((
        {
            title,
            field,
            expanded,
            children
        }:{
            title:string;
            field:'withTimeFrame'|'isGroupTask' | 'trackTime'|'hasFiles';
            expanded:boolean;
            children:JSX.Element;
        }
    )=>{
        const
            {palette:{grey,mode}} = useTheme(),
            {addEditTaskDispatch} = useContext(Context),
            onChange = (_:SyntheticEvent,value:boolean) => addEditTaskDispatch(toggleAccordionAction({key:field,value}))

        return (
            <Accordion 
                disableGutters 
                expanded={expanded}
                sx={{
                    boxShadow:'none',
                    '&:before':{
                        opacity:'0'
                    }
                }}
                onChange={onChange}
            >
                <AccordionSummary 
                    expandIcon={expanded ? <CheckCircleRoundedIcon color='primary' /> : <RadioButtonUncheckedRoundedIcon />}
                    sx={{
                        backgroundColor:expanded 
                            ? blue[mode==='light' ? 50 : 800] 
                            : grey[mode==='light' ? 50 : 800],
                        '.Mui-expanded':{
                            transform:'none !important'
                        }
                    }}
                >{title}</AccordionSummary>
                <AccordionDetails
                    sx={{
                        ...(mode==='dark' && {
                            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))'
                        }),
                    }}
                >
                    {children}
                </AccordionDetails>
            </Accordion>
        )
    })

AddEditTaskAccordion.displayName = 'AddEditTaskAccordion'
export default AddEditTaskAccordion