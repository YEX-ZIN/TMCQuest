import React from 'react';
import {KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icons from './Icons.js';
import { Button, ButtonTray } from './Button.js';

const Form = ({children, onSubmit, onCancel, submitLabel, submitIcon, submitButtonStyle, submitLabelStyle, cancelButtonStyle, cancelLabelStyle}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  // View --------------------------------
  return (
    <KeyboardAvoidingView style={styles.formContainer}>
        
        <ScrollView contentContainerStyle={styles.formItems}>
            {children}
        </ScrollView>

        <ButtonTray>
            <Button label={submitLabel} icon={submitIcon} onClick={onSubmit} styleButton={submitButtonStyle} styleLabel={submitLabelStyle}/>
            <Button label="Cancel" icon={<Icons.Close/>} onClick={onCancel} styleButton={cancelButtonStyle} styleLabel={cancelLabelStyle}/>
        </ButtonTray>

    </KeyboardAvoidingView>
  );
};

const InputText = ({label, value, onChange, secureTextEntry = false, labelStyle, inputStyle, placeholder = '', placeholderTextColor = '#9ca3af', textContentType = 'none', autoComplete = 'off'}) => {
    const [internalValue, setInternalValue] = React.useState(value);
    const inputRef = React.useRef(null);
    
    React.useEffect(() => {
        setInternalValue(value);
    }, [value]);
    
    const handleChange = (text) => {
        setInternalValue(text);
        onChange(text);
    };
    
    const handleEndEditing = () => {
        // Ensure parent state is synced when field loses focus (critical for autofill)
        if (internalValue !== value) {
            onChange(internalValue);
        }
    };
    
    return(
        <View style={styles.item}>
            <Text style={[styles.itemLabel, labelStyle]}>{label}</Text>
            <TextInput
                ref={inputRef}
                value={internalValue}
                onChangeText={handleChange}
                onEndEditing={handleEndEditing}
                style={[styles.itemTextInput, inputStyle]}
                secureTextEntry={secureTextEntry}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                textContentType={textContentType}
                autoComplete={autoComplete}
                editable={true}
            />
        </View>
    );
};

const InputSelect = ({label, prompt, options, value, onChange, isLoading = false }) => {
    // Initialisations ---------------------
    // State -------------------------------
    // Handlers ----------------------------
    // View --------------------------------
    return(
        <View style={styles.item}>
        <Text style={styles.itemLabel}>{label}</Text>
        {
            isLoading ? (
            <View style={styles.itemLoading}>
                <Text style={styles.itemLoadingText}>Loading records ...</Text>
                </View>
            ):(<Picker
            mode="dropdown"
            selectedValue={value}
            onValueChange={onChange}
            style={styles.itemPickerStyle}
        >
            <Picker.Item value={null} label={prompt} style={styles.itemPickerPromptStyle}/>
            {
                options.map( (option, index) => <Picker.Item key={index} value={option.value} label={option.label}/>)
            }
        </Picker>
)}
        </View>
    );
};

// Compose components
Form.InputText = InputText;
Form.InputSelect = InputSelect;
 
// Styles
const styles = StyleSheet.create({
    formContainer:{
        gap: 10,
        paddingBottom: 40,
        marginBottom: 30,
    },
    formItems:{
        gap: 5,
    },
    itemLabel:{
        color: 'grey',
        fontSize: 16,
        marginBottom: 5,
    },
    itemLoading:{
        height: 50,
        backgroundColor: 'mistyrose',
        justifyContent: 'center',
        paddingLeft: 10,
    },
    itemLoadingText:{
        fontSize: 16,
        color: 'gray',
    },
    itemTextInput:{
        height: 50,
        paddingLeft: 10,
        fontSize: 16,
        backgroundColor: 'white',
        borderRadius: 7,
        borderWidth: 1,
        borderColor: 'lightgray',
    },
    itemPickerStyle:{
        height: 200,
        //backgroundColor: 'whitesmoke',
    },
    itemPickerPromptStyle:{
        color: 'gray',
    },
});

export default Form;