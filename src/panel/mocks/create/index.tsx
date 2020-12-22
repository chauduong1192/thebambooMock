import * as React from "react";
import { Formik, Form, Field, } from "formik";
import styled from "styled-components";

import { IMockResponse, IMockResponseRaw } from "../../../interface/mock";
import { IMethod } from "../../../interface/network";
import MultiSelect from "../../components/multiselect";
import { getNetworkMethodList } from "../../../services/collection";
import { isValidJSON, getError } from "../../../services/helper";
import { Button } from "../../components/table";

const Wrapper = styled("div")`
  border-left: ${({ theme }) => `1px solid ${theme.colors.border}`};
  height: 100%;
  overflow: auto;
`;

const Label = styled("label")`
  margin-bottom: 4px;
  font-weight: 700;
`;

const Input = styled(Field) <{ small?: boolean }>`
  height: 25px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  border-style: solid;
  ${({ small }) => small && `width: 124px;`};
`;

const Textarea = styled("textarea") <{ error?: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  border-style: solid;
  ${({ error, theme }) => error && `border: 1px solid ${theme.colors.alert};`};
`;

const FieldWrapper = styled("div")`
  display: flex;
  flex-direction: column;
  flex-grow: 2;
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  ${FieldWrapper}:not(:last-child) {
    margin-right: 16px;
  }
`;

const Actions = styled.div`
  display: flex;
`;

const StyledForm = styled(Form)`
  padding: 8px 16px;
  width: 656px;
`;

const Error = styled("p")`
  color: ${({ theme }) => theme.colors.alert};
  height: 16px;
  margin-bottom: 8px;
`;

interface IProps {
  mock?: IMockResponseRaw;
  changeRoute: (route: string) => void;
  onAction: (
    action: "add" | "delete" | "edit" | "clear",
    mock: IMockResponse | void
  ) => void;
}

const validate = (values) => {
  const errors: Record<string, string> = {};

  if (values.response && !isValidJSON(values.response)) {
    errors.response = "Invalid Response JSON";
  }

  return errors;
}

const Create = (props: IProps) => {
  const methods = getNetworkMethodList();
  const componentProps = props;

  const handleSubmit = async (values) => {
    componentProps.onAction(componentProps?.mock?.id ? "edit" : "add", {
      id: -1,
      createdOn: new Date().getTime(),
      active: true,
      ...(componentProps.mock ? componentProps.mock : {}),
      ...values,
    });
    componentProps.changeRoute("mock");
  };
  const renderFormmikForm = (args) => {
    const {
      values,
      touched,
      errors,
      dirty,
      isSubmitting,
      handleChange,
      handleBlur,
      handleSubmit,
      handleReset,
      isValid,
      setFieldValue,
    } = args;

    return (
      <StyledForm>
        <Group>
          <FieldWrapper style={{ flexGrow: 0 }}>
            <Label>Active:</Label>
            <MultiSelect
              onSelect={(index) => {
                setFieldValue("active", index ? false : true);
              }}
              options={["Active", "Inactive"]}
              selected={values.active ? 0 : 1}
            />
          </FieldWrapper>
          <FieldWrapper style={{ flexGrow: 3 }}>
            <Label>URL:</Label>
            <Input required name="url"></Input>
          </FieldWrapper>
        </Group>
        <Group>
          <FieldWrapper>
            <Label>Method:</Label>
            <MultiSelect
              onSelect={(index) => {
                setFieldValue("method", methods[index]);
              }}
              options={methods}
              selected={methods.indexOf(values.method as IMethod)}
            />
          </FieldWrapper>
          <FieldWrapper>
            <Label>Status:</Label>
            <Input small="true" required name="status" type="number"></Input>
          </FieldWrapper>
          <FieldWrapper>
            <Label>Delay (in ms):</Label>
            <Input small="true" required name="delay" type="number"></Input>
          </FieldWrapper>
        </Group>
        <Group>
          <FieldWrapper>
            <Label>Response:</Label>
            <Textarea
              error={!!errors.response}
              value={values.response}
              rows={10}
              name="response"
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </FieldWrapper>
        </Group>
        <Group style={{ justifyContent: "space-between", marginTop: 16 }}>
          <Actions>
            <Button
              style={{ marginRight: 16, padding: '4px 28px' }}
              disabled={!isValid}
              type="submit"
              background="primary"
              color="white"
            >
              Save
                  </Button>
            <Button
              onClick={() => componentProps.onAction("clear")}
              type="button"
            >
              Cancel
                  </Button>
          </Actions>
          <Error>{getError(errors) || " "}</Error>
        </Group>
      </StyledForm>
    );
  };

  return (
    <Wrapper>
      <Formik
        validateOnBlur
        initialValues={{
          method: componentProps.mock.method,
          url: componentProps.mock.url,
          status: componentProps.mock.status,
          delay: componentProps.mock.delay,
          response: componentProps.mock.response,
          active: componentProps.mock.active,
        }}
        validate={validate}
        onSubmit={handleSubmit}
        render={renderFormmikForm}
        enableReinitialize
      />
    </Wrapper>
  );
};

Create.defaultProps = {
  mock: {
    active: true,
    method: 'GET',
    url: 'https://',
    status: 200,
    delay: 500,
    response: "{}",
  }
}

export default Create;
