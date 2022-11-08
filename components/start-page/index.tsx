import React, { memo } from 'react';
import { shallowEqual } from "react-redux";
import { useRouter } from 'next/router';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import Grid from '@mui/material/Grid';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import DepartmentNames from './departments';
import { updateStep } from './reducer';
import { useAppDispatch, useAppSelector } from '@reducers';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CoworkerDetails from './staff-details';
import { getFiledataPromise, pushToLogin, updateSession } from '../functions';
import SelectAdmin from './select-admin';
import Paper from '@mui/material/Paper';
import Papa from 'papaparse'

const 
    StartSection = () => {
        const
            theme = useTheme(),
            matchesMD = useMediaQuery(theme.breakpoints.up('md')),
            numberOfSteps = 3,
            step = useAppSelector(state=>state.startPage.step,shallowEqual)

        return (
            <Paper
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p:matchesMD ? 3 : 2,
                }}
            >
                <StepperHeader />
                <Grid 
                    container 
                    direction='row' 
                    mt={2}
                >
                    {Array.from(Array(numberOfSteps).keys(),index=>(
                        <Box 
                            key={index}
                            sx={{
                                display:step===index?'block':'none',
                                width:'100%'
                            }}
                        >
                            {index===0 && <DepartmentNames />}
                            {index===1 && <CoworkerDetails />}
                            {index===2 && <SelectAdmin />}
                        </Box>
                    ))}
                </Grid>
                <Grid
                    container
                    direction='row'
                    sx={{
                        justifyContent:'space-between',
                        mt:2
                    }}
                >
                    <BackwardButton />
                    {step < 2 ? <ForwardButton /> : <SubmitButton step={step} />}
                </Grid>
            </Paper>
        )
    },
    StepperHeader = memo(() => {
        const 
            step = useAppSelector(state=>state.startPage.step,shallowEqual),
            steps = useAppSelector(state=>state.startPage.steps,shallowEqual),
            completed = useAppSelector(state=>state.startPage.completed,shallowEqual),
            theme = useTheme(),
            matchesMD = useMediaQuery(theme.breakpoints.up('md')),
            dispatch = useAppDispatch(),
            router = useRouter(),
            handleStep = (s:number) => () => {
                updateSession(router,dispatch)
                dispatch(updateStep(s))
            }

        return (
            <Stepper activeStep={step}>
                {steps.map((label,i)=>(
                    <Step key={label} completed={completed[i]}>
                        <StepButton color="inherit" onClick={handleStep(i)}>
                            {matchesMD && label}
                        </StepButton>
                    </Step>
                ))}
            </Stepper>
        )
    }),
    BackwardButton = memo(() => {
        const
            dispatch = useAppDispatch(),
            router = useRouter(),
            step = useAppSelector(state=>state.startPage.step,shallowEqual),
            stepBackward = () => {
                updateSession(router,dispatch)
                dispatch(updateStep(step-1))
            }

        return (
            <Button 
                startIcon={<ArrowBackIosIcon />} 
                sx={{visibility:step > 0 ? 'visible' : 'hidden'}}
                onClick={stepBackward}
            >Back</Button>
        )
    }),
    ForwardButton = memo(()=>{
        const
            dispatch = useAppDispatch(),
            router = useRouter(),
            step = useAppSelector(state=>state.startPage.step,shallowEqual),
            completed = useAppSelector(state=>state.startPage.completed[step],shallowEqual),
            stepForward = () => {
                updateSession(router,dispatch)
                dispatch(updateStep(step+1))
            }

        return (
            <Button 
                endIcon={<ArrowForwardIosIcon />}
                disabled={!completed}
                onClick={stepForward}
            >Next</Button>
        )
    }),
    SubmitButton = memo(({step}:{step:number})=>{
        const
            completed = useAppSelector(state=>state.startPage.completed[step],shallowEqual),
            router = useRouter(),
            deptFormat = useAppSelector(state=>state.startPage.deptFormat,shallowEqual),
            adminStaffID = useAppSelector(state=>state.startPage.adminStaffID,shallowEqual),
            getDeptList = async() => {
                if (deptFormat==='csv'){
                    try {
                        const rawStr = await getFiledataPromise((document.getElementById('deptCSVfile') as HTMLInputElement).files[0])
                        if (typeof rawStr !== 'string') return []
                        const rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][]
                        return rows.map(row=>({i:row[0].trim(),n:row[1].trim()}))
                    } catch (error) {
                        return []
                    }
                } else {
                    const 
                        idFields = document.getElementsByName('dept-manual-id') as NodeListOf<HTMLInputElement>,
                        nameFields = document.getElementsByName('dept-manual-name') as NodeListOf<HTMLInputElement>,
                        len = idFields.length
        
                    let ids:string[] = [], names:string[] = [], result:{i:string;n:string}[] = []
                    
                    idFields.forEach(e=>ids.push(e.value.trim()))
                    nameFields.forEach(e=>names.push(e.value.trim()))

                    for (let j=0; j<len; j++){
                        result.push({i:ids[j],n:names[j]})
                    }
                    return result
                }
            },
            getStaffList = async() => {
                try {
                    const rawStr = await getFiledataPromise((document.getElementById('coworkerCSVfile') as HTMLInputElement).files[0]);
                    if (typeof rawStr !== 'string') return []
                    const rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][]
                    return rows.filter((_,i)=>i > 1).map(row=>({
                        id:row[0].trim(),
                        fn:row[1].trim(),
                        ln:row[2].trim(),
                        e:row[3].trim(),
                        t:row[4].trim(),
                        d:row[5].trim(),
                        s:row[6].trim().length > 0 ? row[6].trim() : null,
                        ur:Array.from(Array(4).keys(),i=>(+row[i+7]) * Math.pow(2,i)).reduce((a,b)=>a+b)
                    }))
                } catch (error) {
                    return []
                }
            },
            submit = async() => {
                try {
                    const 
                        [depts,staffDetails] = await Promise.all([getDeptList(),getStaffList()]),
                        thePack = {depts,staffDetails,adminStaffID},
                        res = await fetch('/api/start/submit',{
                            method: 'POST',
                            body: JSON.stringify(thePack),
                            headers: { 
                                'Content-Type': 'application/json',
                                sMethod:'ck'
                            },
                            credentials:'include',
                        }),
                        json = await res.json()
                    
                    if (json.data.success) router.push("/")
                    else if (!json.data.signedIn) pushToLogin(router)
                    else console.log(json)
                } catch (error) {
                    console.log(error)
                }
            }

        return (
            <Button 
                endIcon={<ArrowForwardIosIcon />}
                disabled={!completed}
                onClick={submit}
            >Submit</Button>
        )
    })

BackwardButton.displayName = 'BackwardButton'
ForwardButton.displayName = 'ForwardButton'
SubmitButton.displayName = 'SubmitButton'
StepperHeader.displayName = 'StepperHeader'
export default StartSection;