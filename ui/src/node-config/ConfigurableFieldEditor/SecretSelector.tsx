import React, { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Input,
    Button,
} from "../..";
import { SecretTypeData } from "@flyde/core";

// Define a minimal EditorPorts interface with just what we need
interface EditorPorts {
    getAvailableSecrets: () => Promise<string[]>;
    addNewSecret: (dto: { key: string; value: string }) => Promise<string[]>;
}

export function SecretSelector({
    value,
    onChange,
    ports,
    typeEditorData,
}: {
    value: string;
    onChange: (value: string) => void;
    ports: EditorPorts;
    typeEditorData?: SecretTypeData;
}) {
    const [secrets, setSecrets] = useState<string[]>([]);
    const [isAddingSecret, setIsAddingSecret] = useState(false);
    const [newSecretKey, setNewSecretKey] = useState("");
    const [newSecretValue, setNewSecretValue] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSecrets = async () => {
            setIsLoading(true);
            try {
                const availableSecrets = await ports.getAvailableSecrets();
                setSecrets(availableSecrets);
            } catch (error) {
                console.error("Failed to fetch secrets:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSecrets();
    }, [ports]);

    const handleAddSecret = async () => {
        if (!newSecretKey || !newSecretValue) {
            return;
        }

        try {
            const updatedSecrets = await ports.addNewSecret({
                key: newSecretKey,
                value: newSecretValue,
            });
            setSecrets(updatedSecrets);
            onChange(newSecretKey);
            setIsAddingSecret(false);
            setNewSecretKey("");
            setNewSecretValue("");
        } catch (error) {
            console.error("Failed to add secret:", error);
        }
    };

    const startAddingSecret = () => {
        setIsAddingSecret(true);
        if (typeEditorData?.defaultName) {
            setNewSecretKey(typeEditorData.defaultName);
        }
    };

    const handleValueChange = (newValue: string) => {
        if (newValue === "__add_new_secret") {
            startAddingSecret();
        } else {
            onChange(newValue);
        }
    };

    if (isAddingSecret) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input
                        placeholder="Secret key"
                        value={newSecretKey}
                        size={12}
                        onChange={(e) => setNewSecretKey(e.target.value)}
                    />
                    <Input
                        placeholder="Secret value"
                        type="password"
                        size={12}
                        value={newSecretValue}
                        onChange={(e) => setNewSecretValue(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingSecret(false)}>
                        Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={handleAddSecret}>
                        Add
                    </Button>
                </div>
            </div>
        );
    }

    if (!isLoading && secrets.length === 0) {
        return (
            <div className="flex flex-col gap-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-900">
                <p className="text-sm text-gray-600 dark:text-gray-400">No secrets available.</p>
                <Button variant="outline" size="sm" onClick={startAddingSecret}>
                    Create a new secret
                </Button>
            </div>
        );
    }

    return (
        <Select value={value} onValueChange={handleValueChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select or create a secret" />
            </SelectTrigger>
            <SelectContent>
                {secrets.length > 0 ? (
                    <>
                        {secrets.map((secret) => (
                            <SelectItem key={secret} value={secret}>
                                {secret}
                            </SelectItem>
                        ))}
                        <SelectItem value="__add_new_secret">
                            + Add new secret
                        </SelectItem>
                    </>
                ) : (
                    <SelectItem value="__add_new_secret">
                        + Create your first secret
                    </SelectItem>
                )}
            </SelectContent>
        </Select>
    );
} 